import React, { createRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { useFirebase } from "../Context/FirebaseContext";
import { useAuth } from "../Context/AuthContext";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

function Room() {
  const params = useParams();
  const roomKey = params.roomKey;
  const { db } = useFirebase();
  const { currentUser } = useAuth();
  const pc = new RTCPeerConnection(servers);
  console.log("1pc.currentRemoteDescription", pc.currentRemoteDescription);

  const localVideo = createRef(null);
  let localStream = null;
  const remoteVideo = createRef(null);
  let remoteStream = null;

  const [isLoading, setIsLoading] = useState(true);
  const [isRoomExist, setIsRoomExist] = useState(false);
  const [isRoomOwner, setIsRoomOwner] = useState(false);

  const [room, setRoom] = useState(null);

  useEffect(() => {
    const docRef = doc(db, "rooms", roomKey);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        // start video call bussiness
        const docData = docSnap.data();
        setIsRoomExist(true);
        console.log("room ton tai ", docData);
        setRoom(docData);

        console.log("currentUser:", currentUser);
        setIsRoomOwner(docData?.createrUid === currentUser.uid);
        console.log("docData?.createrUid", docData?.createrUid);
        console.log("rcurrentUser.uid", currentUser.uid);
        console.log(docData?.createrUid === currentUser.uid);
        console.log(isRoomOwner);
      } else {
        // inform room not exist to user
        setIsRoomExist(false);
        console.log("khong ton tai phong");
      }
      setIsLoading(false);
    });
  }, [roomKey]);
  const turnOnCamera = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((resp) => {
        localStream = resp;

        remoteStream = new MediaStream();

        // Push tracks from local stream to peer connection
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Pull tracks from remote stream, add to video stream
        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };

        localVideo.current.srcObject = localStream;
        remoteVideo.current.srcObject = remoteStream;
      });
  };

  const createOffer = async () => {
    // Reference Firestore collections for signaling
    const roomDoc = doc(db, "rooms", roomKey);
    const offerCandidates = collection(db, "rooms", roomKey, "offerCandidates");
    const answerCandidates = collection(
      db,
      "rooms",
      roomKey,
      "answerCandidates"
    );

    if (isRoomOwner) {
      pc.onicecandidate = async (event) => {
        console.log("CALLER: onicecandidate ", event.candidate);
        if (event.candidate) {
          const ref = await addDoc(offerCandidates, event.candidate.toJSON());
        }
      };
      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(roomDoc, { offer }, { merge: true });

      // Listen for remote answer, unsublater
      onSnapshot(roomDoc, (snapshot) => {
        const data = snapshot.data();

        console.log("CALLER: roomDoc change", data);
        console.log("pc.currentRemoteDescription", pc.currentRemoteDescription);
        // !pc.currentRemoteDescription &&?
        if (!pc.currentRemoteDescription && data?.answer) {
          console.log("setRemoteDescription ", data.answer);
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });

      // When answered, add candidate to peer connection
      onSnapshot(answerCandidates, (snapshot) => {
        console.log("CALLER: answerCandidates change", snapshot.docChanges());
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            console.log("CALLER: addIceCandidate ", candidate);
            pc.addIceCandidate(candidate);
          }
        });
      });

      // hangupButton.disabled = false;
    } else {
      // Get candidates for caller, save to db
      pc.onicecandidate = async (event) => {
        console.log("ANSWER: onicecandidate ", event.candidate);
        if (event.candidate) {
          const ref = await addDoc(answerCandidates, event.candidate.toJSON());
        }
      };

      const roomData = (await getDoc(roomDoc)).data();

      const offerDescription = roomData.offer;
      console.log("GET OFFER ", offerDescription);
      await pc.setRemoteDescription(
        new RTCSessionDescription(offerDescription)
      );

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await setDoc(roomDoc, { answer }, { merge: true });

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log("ANSWER: offerCandidates change: ", change);
          if (change.type === "added") {
            let data = change.doc.data();
            console.log("ANSWER: addIceCandidate", data);
            pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    }
  };
  const VideoCall = () => {
    return (
      <>
        <div>
          <h2>{isRoomOwner ? "Owner" : "Guest"}</h2>
          <div style={{ display: "inline-block" }}>
            <h3>Local Stream</h3>
            <video
              id="webcamVideo"
              autoPlay
              playsInline
              ref={localVideo}
              style={{
                width: "40vw",
                height: "30vw",
                margin: "2rem",
                background: "#2c3e50",
              }}
            ></video>
          </div>
          <div style={{ display: "inline-block" }}>
            <h3>Remote Stream</h3>
            <video
              id="remoteVideo"
              playsInline
              autoPlay
              ref={remoteVideo}
              style={{
                width: "40vw",
                height: "30vw",
                margin: "2rem",
                background: "#2c3e50",
              }}
            ></video>
          </div>
        </div>

        <button onClick={turnOnCamera}>Turn on Camera</button>
        <button onClick={createOffer}>Create offer</button>
      </>
    );
  };
  return (
    <>
      {isLoading ? (
        <div>loading...</div>
      ) : isRoomExist ? (
        <VideoCall />
      ) : (
        <div>room not exist</div>
      )}
    </>
  );
}

function CheckRoomExist(db, roomKey) {}

export default Room;

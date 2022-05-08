import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import socketIOClient from "socket.io-client";

import { doc, getDoc } from "firebase/firestore";
import { useFirebase } from "../Context/FirebaseContext";
import { useAuth } from "../Context/AuthContext";

const servers = {
  iceServers: [
    // {
    //   urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    // },
    {
      urls: "turn:turn.sondc.dev",
      username: "test",
      credential: "test123",
    },
  ],
  iceCandidatePoolSize: 10,
};

const host = "https://morning-bastion-27437.herokuapp.com/";

function Room() {
  const params = useParams();
  const roomKey = params.roomKey;
  const { db } = useFirebase();
  const { currentUser } = useAuth();
  let pc = new RTCPeerConnection(servers);

  const localVideo = useRef();
  const remoteVideo = useRef();

  const socketRef = useRef();

  const [isRoomExist, setIsRoomExist] = useState(true);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [room, setRoom] = useState(null);

  console.log("render", { localVideo, remoteVideo, localStream, remoteStream });

  useEffect(() => {
    console.log("empty UseEffect");

    const docRef = doc(db, "rooms", roomKey);
    let isOwner = false;
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        // start video call bussiness
        const docData = docSnap.data();
        setIsRoomExist(true);
        setRoom(docData);
        // check current user is owner of room
        isOwner = docData?.createrUid === currentUser.uid;
        setIsRoomOwner(isOwner);

        navigator.mediaDevices
          .getUserMedia({
            video: true,
            audio: true,
          })
          .then((resp) => {
            const lcStream = resp;
            setLocalStream(lcStream);
            const rmtStream = new MediaStream();
            setRemoteStream(rmtStream);
            localVideo.current.srcObject = lcStream;
            remoteVideo.current.srcObject = rmtStream;

            console.log("afterset", {
              localVideo,
              remoteVideo,
              lcStream,
              rmtStream,
            });
            console.log("emit joinRoom");
            socketRef.current.emit("joinRoom", {
              roomKey,
              isOwner,
            });
          });

        setUpSocket(isOwner);
      } else {
        // inform room not exist to user
        setIsRoomExist(false);
        console.log("khong ton tai phong");
      }
    });
  }, []);

  useEffect(() => {
    console.log("useEffect", { localVideo, remoteVideo });
    if (localVideo === null || remoteVideo === null) {
      return;
    }

    socketRef.current = socketIOClient.connect(host);
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((resp) => {
        const lcStream = resp;
        setLocalStream(lcStream);
        const rmtStream = new MediaStream();
        setRemoteStream(rmtStream);
        localVideo.current.srcObject = lcStream;
        remoteVideo.current.srcObject = rmtStream;

        console.log("afterset", {
          localVideo,
          remoteVideo,
          lcStream,
          rmtStream,
        });
      });

    return () => {
      socketRef.current.disconnect();
    };
  }, [localVideo, remoteVideo]);

  useEffect(() => {
    if (localVideo === null) {
      return;
    }
    localVideo.current.srcObject = localStream;
    if (remoteVideo === null) {
      return;
    }
    remoteVideo.current.srcObject = remoteStream;

    setUpSocket(isRoomOwner);
  });

  const setUpSocket = (isOwner) => {
    // socket.removeAllListeners();
    socketRef.current.removeAllListeners();
    socketRef.current.on("ownerStart", (message) => {
      console.log("ownerStart", isOwner);
      if (isOwner) {
        setUpOwnerConnection().then((offer) => {
          console.log("ownerStart send", offer);
          socketRef.current.emit("upOffer", { isOwner, roomKey, offer });
        });
      } else {
        console.log("some thing wrong");
      }
    });

    socketRef.current.on("downOffer", (offer) => {
      console.log("from server [downOffer]:", { isRoomOwner, offer });
      if (offer === null) {
        return;
      }
      if (isRoomOwner) {
        const answerDescription = new RTCSessionDescription(offer);
        console.log("OWNER SET setRemoteDescription");
        pc.setRemoteDescription(answerDescription);
        socketRef.current.emit("getOtherCandidates", { isOwner, roomKey });
      } else {
        // recreate p
        setUpGuestConnection(offer).then((guestOffer) => {
          console.log("GUEST upOffer", guestOffer);
          socketRef.current.emit("upOffer", {
            isOwner,
            roomKey,
            offer: guestOffer,
          });
          socketRef.current.emit("getOtherCandidates", { isOwner, roomKey });
        });
      }

      // re-create peer-to-peer connection and send to socket to update
    });

    socketRef.current.on("downOtherCandidates", (candidates) => {
      console.log("downOtherCandidates", candidates);
      candidates.forEach((candidate) => {
        if (pc != null && pc.remoteDescription != null) {
          pc.addIceCandidate(candidate);
        }
      });
    });

    socketRef.current.on("otherLeave", (data) => {
      console.log("from server [otherLeave]:", data);
      // re-create peer-to-peer connection and send to socket to update
    });

    socketRef.current.on("message", (data) => {
      console.log("from server [message]:", data);
    });

    socketRef.current.on("otherUpdateCandidate", (candidate) => {
      if (pc != null && pc.remoteDescription != null) {
        // pc.addIceCandidate(candidate);
      }
    });
  };

  const turnOnCamera = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((resp) => {
        localStream = resp;

        console.log("set localStream");

        remoteStream = new MediaStream();
        console.log("localVideo.current", localVideo.current);
        console.log("remoteVideo.current", remoteVideo.current);

        return resp;
      });

    return;
  };

  const setUpOwnerConnection = async () => {
    if (localStream === null || remoteStream === null) {
      return;
    }
    console.log("setUpOwnerConnection", { localStream, remoteStream });

    pc = new RTCPeerConnection(servers);

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

    pc.onicecandidate = (event) => {
      console.log("OWNER: onicecandidate ", event.candidate);
      if (event.candidate) {
        socketRef.current.emit("updateCandidate", {
          roomKey,
          isRoomOwner,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    console.log("OWNER RECREATE CONNECTION", offer);
    return offer;

    // hangupButton.disabled = false;
  };

  const setUpGuestConnection = async (ownerOffer) => {
    if (localStream === null || remoteStream === null) {
      return;
    }
    console.log("setUpGuestConnection", {
      ownerOffer,
      localStream,
      remoteStream,
    });

    pc = new RTCPeerConnection(servers);

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

    pc.onicecandidate = (event) => {
      console.log("GUEST: onicecandidate ", event.candidate);
      if (event.candidate) {
        socketRef.current.emit("updateCandidate", {
          roomKey,
          isRoomOwner,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    const ownerPfferDescription = ownerOffer;
    await pc.setRemoteDescription(
      new RTCSessionDescription(ownerPfferDescription)
    );

    // Create offer
    const offerDescription = await pc.createAnswer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
    console.log("GUEST RECREATE CONNECTION", offer);
    return offer;

    // hangupButton.disabled = false;
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
        <button onClick={turnOnCamera}> Turn on cammera</button>
      </>
    );
  };
  return (
    <>
      <VideoCall />
    </>
  );
}

export default Room;

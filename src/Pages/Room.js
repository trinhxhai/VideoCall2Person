import React, { useEffect, useRef, useState, useCallback } from "react";
import "./Room.css";
import { useParams } from "react-router-dom";
import { FaFileMedical } from "react-icons/fa";
import socketIOClient from "socket.io-client";

import { doc, getDoc } from "firebase/firestore";
import { useFirebase } from "../Context/FirebaseContext";
import { useAuth } from "../Context/AuthContext";

const servers = {
  iceServers: [
    {
      urls: "turn:turn.sondc.dev",
      username: "test",
      credential: "test123",
    },
  ],
};

// const host = "https://morning-bastion-27437.herokuapp.com/";
const host = "http://localhost:3000/";

function Room() {
  const params = useParams();
  const roomKey = params.roomKey;
  const { db } = useFirebase();
  const { currentUser } = useAuth();
  let pc = new RTCPeerConnection(servers);

  const localVideo = useRef();
  const remoteVideo = useRef();

  const socketRef = useRef();

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
            console.log("empty UseEffect navigator getmedia");
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
        //

        setUpSocket(isOwner);
      } else {
        console.log("khong ton tai phong");
      }
    });
  }, []);

  useEffect(() => {
    console.log("useEffect2", { localVideo, remoteVideo });
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
        console.log("empty useEffect2 navigator getmedia");
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
    if (localVideo.current.srcObject !== localStream) {
      console.log("re-set localVideo.current.srcObject = localStream;");
      console.log("olcalVideo.current.srcObject", localVideo.current.srcObject);
      localVideo.current.srcObject = localStream;
    }
    if (remoteVideo === null) {
      return;
    }
    if (remoteVideo.current.srcObject !== remoteStream) {
      console.log("re-set localVideo.current.srcObject = localStream;");
      remoteVideo.current.srcObject = remoteStream;
      console.log("re-set localVideo.current.srcObject = localStream;");
    }

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

    setUpSocketForMessage();
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
  // SENDING MESSAGES AND FILES

  // Set up for message
  const setUpSocketForMessage = () => {
    const socket = socketRef.current;

    socket.on("getOtherMessage", ({ message }) => {
      console.log("Socket getOtherMessage: ", message);
      setMessages((prev) => {
        return [...prev, message];
      });
    });
  };

  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);

  const onMessageChange = (e) => {
    e.preventDefault();
    setMessage(e.target.value);
  };

  const onChangeFile = (e) => {
    const file = document.querySelector("input[type=file]").files[0];
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      function () {
        setFile({ str64: reader.result, fileName: file.name });
      },
      false
    );

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const onClickSend = (e) => {
    const messageContent = message;
    console.log("messageContent", messageContent);
    console.log("socketRef.current", socketRef.current);
    socketRef.current.emit("sendOtherMessage", {
      roomKey,
      message: {
        sender: "Other",
        text: messageContent,
        fileStr64: file?.str64,
        fileName: file?.fileName,
      },
    });

    setMessages((pre) => {
      return [
        ...pre,
        {
          sender: "You",
          text: messageContent,
          fileStr64: file?.str64,
          fileName: file?.fileName,
        },
      ];
    });

    setMessage("");
    setFile(null);
  };

  return (
    <>
      <div>
        <h1>Room key:{" " + roomKey}</h1>
      </div>
      <h3>{isRoomOwner ? "Owner" : "Guest"}</h3>
      <div className="stream-container">
        <div>
          <div style={{ display: "inline-block" }}>
            <h3>Local Stream</h3>
            <video
              id="webcamVideo"
              autoPlay
              playsInline
              ref={localVideo}
              style={{
                width: "40rem",
                height: "30rem",
                background: "#2c3e50",
              }}
            ></video>
          </div>
        </div>
        <div style={{ marginLeft: "2rem" }}>
          <h3>Remote Stream</h3>
          <video
            id="remoteVideo"
            playsInline
            autoPlay
            ref={remoteVideo}
            style={{
              width: "40rem",
              height: "30rem",
              background: "#2c3e50",
            }}
            // FaFileMedical
          ></video>
        </div>
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message) => {
              return (
                <div className="message">
                  <div className="message-sender">{message.sender}</div>
                  <div className="message-content">{message.text}</div>
                  <div className="message-attachment">
                    {message.fileStr64 && (
                      <a download={message.fileName} href={message.fileStr64}>
                        {message.fileName}(click to download)
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="controls-container">
            <input
              type="text"
              className="message-input"
              value={message}
              onChange={(e) => {
                onMessageChange(e);
              }}
            />
            <div className="controls">
              <label htmlFor="file">
                <FaFileMedical size={35} />
              </label>
              <button onClick={onClickSend}>Send</button>
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        id="file"
        onChange={(e) => {
          onChangeFile(e);
        }}
        style={{ display: "none" }}
      />
    </>
  );
}

export default Room;

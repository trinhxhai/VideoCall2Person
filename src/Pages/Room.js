import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import socketIOClient from "socket.io-client";

import { doc, getDoc } from "firebase/firestore";
import { useFirebase } from "../Context/FirebaseContext";
import { useAuth } from "../Context/AuthContext";

// const servers = {
//   iceServers: [
//     {
//       urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
//     },
//   ],
//   iceCandidatePoolSize: 10,
// };

// const host = "http://localhost:3000";

// function Room() {
//   // const params = useParams();
//   // const roomKey = params.roomKey;
//   // const { db } = useFirebase();
//   // const { currentUser } = useAuth();
//   // let pc = new RTCPeerConnection(servers);

//   const localVideo = useRef();
//   const remoteVideo = useRef();

//   // const socketRef = useRef();

//   // const [isRoomExist, setIsRoomExist] = useState(true);
//   // const [isRoomOwner, setIsRoomOwner] = useState(false);
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);

//   // const [room, setRoom] = useState(null);

//   console.log("render", { localVideo, remoteVideo, localStream, remoteStream });

//   useEffect(() => {
//     console.log("empty UseEffect");

//     // const docRef = doc(db, "rooms", roomKey);
//     // let isOwner = false;
//     // getDoc(docRef).then((docSnap) => {
//     //   if (docSnap.exists()) {
//     //     // start video call bussiness
//     //     const docData = docSnap.data();
//     //     setIsRoomExist(true);
//     //     setRoom(docData);
//     //     // check current user is owner of room
//     //     isOwner = docData?.createrUid === currentUser.uid;
//     //     setIsRoomOwner(isOwner);

//     //     console.log("emit joinRoom");
//     //     socketRef.current.emit("joinRoom", {
//     //       roomKey,
//     //       isOwner,
//     //     });
//     //   } else {
//     //     // inform room not exist to user
//     //     setIsRoomExist(false);
//     //     console.log("khong ton tai phong");
//     //   }
//     // });
//   }, []);

//   // useEffect(() => {
//   //   console.log("useEffect", { localVideo, remoteVideo });
//   //   if (localVideo === null || remoteVideo === null) {
//   //     return;
//   //   }

//   //   socketRef.current = socketIOClient.connect(host);
//   //   navigator.mediaDevices
//   //     .getUserMedia({
//   //       video: true,
//   //       audio: true,
//   //     })
//   //     .then((resp) => {
//   //       const lcStream = resp;
//   //       setLocalStream(lcStream);
//   //       const rmtStream = new MediaStream();
//   //       setRemoteStream(rmtStream);
//   //       localVideo.current.srcObject = lcStream;
//   //       remoteVideo.current.srcObject = rmtStream;

//   //       console.log("afterset", {
//   //         localVideo,
//   //         remoteVideo,
//   //         lcStream,
//   //         rmtStream,
//   //       });

//   //       setUpSocket(isRoomOwner);
//   //     });

//   //   return () => {
//   //     socketRef.current.disconnect();
//   //   };
//   // }, [localVideo, remoteVideo]);

//   // useEffect(() => {
//   //   if (localVideo === null) {
//   //     return;
//   //   }
//   //   localVideo.current.srcObject = localStream;
//   //   if (remoteVideo === null) {
//   //     return;
//   //   }
//   //   remoteVideo.current.srcObject = remoteStream;

//   //   setUpSocket(isRoomOwner);
//   // });

//   // const setUpSocket = (isOwner) => {
//   //   socketRef.current.on("ownerStart", (message) => {
//   //     console.log("ownerStart", isOwner);
//   //     if (isOwner) {
//   //       setUpOwnerConnection().then((offer) => {
//   //         socketRef.current.emit("upOffer", { isOwner, roomKey, offer });
//   //       });
//   //     } else {
//   //       console.log("some thing wrong");
//   //     }
//   //   });

//   //   socketRef.current.on("downOffer", (offer) => {
//   //     console.log("from server [downOffer]:", offer);
//   //     if (offer === null) {
//   //       return;
//   //     }
//   //     if (isRoomOwner) {
//   //       const answerDescription = new RTCSessionDescription(offer);
//   //       pc.setRemoteDescription(answerDescription);
//   //     } else {
//   //       // recreate p
//   //       setUpGuestConnection().then((offer) => {
//   //         socketRef.current.emit("upOffer", { isOwner, roomKey, offer });
//   //       });
//   //     }
//   //     // re-create peer-to-peer connection and send to socket to update
//   //   });

//   //   socketRef.current.on("otherLeave", (data) => {
//   //     console.log("from server [otherLeave]:", data);
//   //     // re-create peer-to-peer connection and send to socket to update
//   //   });

//   //   socketRef.current.on("getPcData", ({ offer, candidates }) => {
//   //     console.log("client: [getPcData]:", offer, candidates);
//   //     candidates.forEach((candidate) => {
//   //       pc.addIceCandidate(candidate);
//   //     });
//   //     const answerDescription = new RTCSessionDescription(offer);
//   //     pc.setRemoteDescription(answerDescription);
//   //   });

//   //   socketRef.current.on("message", (data) => {
//   //     console.log("from server [message]:", data);
//   //   });

//   //   socketRef.current.on("otherUpdateCandidate", (candidate) => {
//   //     if (pc != null) {
//   //       pc.addIceCandidate(candidate);
//   //     }
//   //   });
//   // };

//   // const turnOnCamera = () => {
//   //   navigator.mediaDevices
//   //     .getUserMedia({
//   //       video: true,
//   //       audio: true,
//   //     })
//   //     .then((resp) => {
//   //       localStream = resp;

//   //       console.log("set localStream");

//   //       remoteStream = new MediaStream();
//   //       console.log("localVideo.current", localVideo.current);
//   //       console.log("remoteVideo.current", remoteVideo.current);

//   //       return resp;
//   //     });

//   //   return;
//   // };

//   // const setUpOwnerConnection = async () => {
//   //   if (localStream === null || remoteStream === null) {
//   //     return;
//   //   }
//   //   console.log("setUpOwnerConnection", { localStream, remoteStream });

//   //   pc = new RTCPeerConnection(servers);

//   //   // Push tracks from local stream to peer connection
//   //   localStream.getTracks().forEach((track) => {
//   //     pc.addTrack(track, localStream);
//   //   });

//   //   // Pull tracks from remote stream, add to video stream
//   //   pc.ontrack = (event) => {
//   //     event.streams[0].getTracks().forEach((track) => {
//   //       remoteStream.addTrack(track);
//   //     });
//   //   };

//   //   pc.onicecandidate = async (event) => {
//   //     // console.log("CALLER: onicecandidate ", event.candidate);
//   //     if (event.candidate) {
//   //       socketRef.current.emit("updateCandidate", {
//   //         roomKey,
//   //         isRoomOwner,
//   //         candidate: event.candidate.toJSON(),
//   //       });
//   //     }
//   //   };
//   //   // Create offer
//   //   const offerDescription = await pc.createOffer();
//   //   await pc.setLocalDescription(offerDescription);

//   //   const offer = {
//   //     sdp: offerDescription.sdp,
//   //     type: offerDescription.type,
//   //   };

//   //   return offer;

//   //   // hangupButton.disabled = false;
//   // };

//   // const setUpGuestConnection = async (ownerOffer) => {
//   //   if (localStream === null || remoteStream === null) {
//   //     return;
//   //   }
//   //   console.log("setUpGuestConnection", { localStream, remoteStream });

//   //   pc = new RTCPeerConnection(servers);

//   //   // Push tracks from local stream to peer connection
//   //   localStream.getTracks().forEach((track) => {
//   //     pc.addTrack(track, localStream);
//   //   });

//   //   // Pull tracks from remote stream, add to video stream
//   //   pc.ontrack = (event) => {
//   //     event.streams[0].getTracks().forEach((track) => {
//   //       remoteStream.addTrack(track);
//   //     });
//   //   };

//   //   pc.onicecandidate = async (event) => {
//   //     // console.log("CALLER: onicecandidate ", event.candidate);
//   //     if (event.candidate) {
//   //       socketRef.current.emit("updateCandidate", {
//   //         roomKey,
//   //         isRoomOwner,
//   //         candidate: event.candidate.toJSON(),
//   //       });
//   //     }
//   //   };

//   //   const ownerPfferDescription = ownerOffer;
//   //   await pc.setRemoteDescription(
//   //     new RTCSessionDescription(ownerPfferDescription)
//   //   );

//   //   // Create offer
//   //   const offerDescription = await pc.createOffer();
//   //   await pc.setLocalDescription(offerDescription);

//   //   const offer = {
//   //     sdp: offerDescription.sdp,
//   //     type: offerDescription.type,
//   //   };

//   //   return offer;

//   //   // hangupButton.disabled = false;
//   // };

//   // const resetPeerToPeerConnection = async () => {
//   //   pc = new RTCPeerConnection(servers);

//   //   // Push tracks from local stream to peer connection
//   //   localStream.getTracks().forEach((track) => {
//   //     pc.addTrack(track, localStream);
//   //   });

//   //   // Pull tracks from remote stream, add to video stream
//   //   pc.ontrack = (event) => {
//   //     event.streams[0].getTracks().forEach((track) => {
//   //       remoteStream.addTrack(track);
//   //     });
//   //   };

//   //   const candidates = [];

//   //   // Reference Firestore collections for signaling
//   //   const roomDoc = doc(db, "rooms", roomKey);

//   //   if (isRoomOwner) {
//   //     pc.onicecandidate = async (event) => {
//   //       console.log("CALLER: onicecandidate ", event.candidate);
//   //       if (event.candidate) {
//   //         socketRef.current.emit("updateCandidate", {
//   //           roomKey,
//   //           isRoomOwner,
//   //           candidate: event.candidate.toJSON(),
//   //         });
//   //       }
//   //     };
//   //     // Create offer
//   //     const offerDescription = await pc.createOffer();
//   //     await pc.setLocalDescription(offerDescription);

//   //     const offer = {
//   //       sdp: offerDescription.sdp,
//   //       type: offerDescription.type,
//   //     };

//   //     return { offer: offer, candidates: candidates };

//   //     // hangupButton.disabled = false;
//   //   } else {
//   //     // Get candidates for caller, save to db
//   //     pc.onicecandidate = async (event) => {
//   //       console.log("ANSWER: onicecandidate ", event.candidate);
//   //       if (event.candidate) {
//   //         socketRef.current.emit("updateCandidate", {
//   //           roomKey,
//   //           isRoomOwner,
//   //           candidate: event.candidate.toJSON(),
//   //         });
//   //       }
//   //     };

//   //     const roomData = (await getDoc(roomDoc)).data();

//   //     const offerDescription = roomData.offer;
//   //     await pc.setRemoteDescription(
//   //       new RTCSessionDescription(offerDescription)
//   //     );

//   //     const answerDescription = await pc.createAnswer();
//   //     await pc.setLocalDescription(answerDescription);

//   //     const answer = {
//   //       type: answerDescription.type,
//   //       sdp: answerDescription.sdp,
//   //     };

//   //     return { offer: answer, candidates: candidates };
//   //   }
//   // };

//   const VideoCall = () => {
//     return (
//       <>
//         <div>
//           {/* <h2>{isRoomOwner ? "Owner" : "Guest"}</h2> */}
//           <div style={{ display: "inline-block" }}>
//             <h3>Local Stream</h3>
//             <video
//               id="webcamVideo"
//               autoPlay
//               playsInline
//               ref={localVideo}
//               style={{
//                 width: "40vw",
//                 height: "30vw",
//                 margin: "2rem",
//                 background: "#2c3e50",
//               }}
//             ></video>
//           </div>
//           <div style={{ display: "inline-block" }}>
//             <h3>Remote Stream</h3>
//             <video
//               id="remoteVideo"
//               playsInline
//               autoPlay
//               ref={remoteVideo}
//               style={{
//                 width: "40vw",
//                 height: "30vw",
//                 margin: "2rem",
//                 background: "#2c3e50",
//               }}
//             ></video>
//           </div>
//         </div>
//         {/* <button onClick={turnOnCamera}> Turn on cammera</button> */}
//       </>
//     );
//   };
//   return (
//     <>
//       <VideoCall />
//     </>
//   );
// }

const Room = () => {
  useEffect(() => {
    console.log("hello");
  }, []);
  return <div></div>;
};

export default Room;

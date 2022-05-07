import React, { useEffect, useState } from "react";
import { useFirebase } from "../Context/FirebaseContext";

import { setDoc, getDoc, doc } from "firebase/firestore";
import { useAuth } from "../Context/AuthContext";

import { makeId } from "../Utils";
import { ROOM_KEY_LENGTH } from "../Constant";

function HomePage() {
  const { db, auth } = useFirebase();
  const { currentUser } = useAuth();

  const [roomKey, setRoomKey] = useState("");

  useEffect(() => {
    console.log(currentUser);
    getCalls(db, currentUser.uid).then((dataSnap) => {
      console.log(dataSnap);
    });
    // console.log(await getDocs(calls));
  }, []);

  const handleRoomKeyChange = (e) => {
    // console.log(e.target);
    const value = e.target.value;
    setRoomKey(value);
  };

  return (
    <>
      <div>
        <label htmlFor="roomKey">email</label>
        <input
          type="text"
          name="roomKey"
          id="roomKey"
          value={roomKey}
          onChange={(e) => {
            handleRoomKeyChange(e);
          }}
        />
      </div>

      <button
        onClick={() => {
          createNewRoom(db, currentUser.uid);
        }}
      >
        create new room
      </button>
    </>
  );
}

async function createNewRoom(db, uid) {
  const roomKey = makeId(ROOM_KEY_LENGTH);

  // add roomKeys to user's room
  await addRoom(db, uid, roomKey)
    .then((resp) => {
      console.log(resp);
    })
    .catch((error) => {
      console.log(error);
    });

  // add new room to room collections
  const roomsRef = doc(db, "rooms", roomKey);
  setDoc(roomsRef, {
    createrUid: uid,
    createdTime: Date.now(),
  });
}

async function addRoom(db, uid, roomKey) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const user = userSnap.data();

  return setDoc(
    userRef,
    { rooms: user.rooms ? [...user.rooms] : [roomKey] },
    {
      merge: true,
    }
  ).then((resp) => {
    return resp;
  });
}

async function getCalls(db, uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const user = userSnap.data();

  return user.rooms;
}

export default HomePage;

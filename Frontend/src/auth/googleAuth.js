import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { setVerified } from "../utils/verifyStatus";

export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);

  setVerified();

  return res.user;
};

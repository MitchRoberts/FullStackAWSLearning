import { useState } from "react";
import { doSignUp, doConfirm, doSignIn, doSignOut, whoAmI } from "../lib/auth";

export default function AuthSmoke() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  return (
    <div className="p-6 space-y-3">
      <div className="flex gap-2">
        <input className="border px-2 py-1" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="border px-2 py-1" placeholder="password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
        <button className="border px-3" onClick={() => doSignUp(email, pw)}>Sign up</button>
      </div>
      <div className="flex gap-2">
        <input className="border px-2 py-1" placeholder="code" value={code} onChange={e => setCode(e.target.value)} />
        <button className="border px-3" onClick={() => doConfirm(email, code)}>Confirm</button>
      </div>
      <div className="flex gap-2">
        <button className="border px-3" onClick={() => doSignIn(email, pw)}>Sign in</button>
        <button className="border px-3" onClick={() => doSignOut()}>Sign out</button>
        <button className="border px-3" onClick={async () => alert(JSON.stringify(await whoAmI()))}>Who am I?</button>
      </div>
    </div>
  );
}

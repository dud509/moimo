// ============================================================
// 이름 입력 화면 (피그마 Desktop-7)
//
// 펼쳐진 다이어리 안에 아직 정해지지 않은 회색 모이모가 있고,
// 아래에 "이름이 머야?" 입력칸과 "눌러바" 버튼이 있습니다.
//
// 아래 x, y, w 는 피그마에 뜨는 숫자 그대로입니다.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import Tablet from '../components/Tablet.jsx';
import { createCharacter } from '../character/generate.js';
import { onScreen } from '../lib/layout.js';
import { useSession } from '../SessionContext.jsx';

const SPOT = {
  unknown: { x: 1156, y: 720, w: 243 },
  input: { x: 987, y: 1057, w: 400, h: 80 },
  submit: { x: 1419, y: 1057, w: 148, h: 80 },
};

export default function NamePage() {
  const [name, setName] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { startWith } = useSession();

  // 화면이 열리면 바로 글자를 칠 수 있도록 입력칸에 커서를 둡니다.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    startWith(cleanName, createCharacter(cleanName));
    navigate('/character');
  }

  return (
    <Layout>
      <Tablet>
        <form className="name-screen" onSubmit={handleSubmit}>
          <img
            className="name-screen__unknown"
            src="/ui/unknown.svg"
            alt="아직 정해지지 않은 모이모"
            style={onScreen(SPOT.unknown)}
          />

          <input
            ref={inputRef}
            className="name-input"
            style={onScreen(SPOT.input)}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름이 머야?"
            maxLength={12}
            autoComplete="off"
            aria-label="이름"
          />

          <button
            className="button button--pink name-screen__submit"
            style={onScreen(SPOT.submit)}
            type="submit"
            disabled={!name.trim()}
          >
            눌러바
          </button>
        </form>
      </Tablet>
    </Layout>
  );
}

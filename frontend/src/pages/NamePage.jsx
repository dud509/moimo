// ============================================================
// 이름 입력 화면 (피그마 Desktop-7)
//
// 태블릿 안에 아직 정해지지 않은 회색 모이모가 있고,
// 아래에 "이름이 머야?" 입력칸과 "눌러바" 버튼이 있습니다.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import Tablet from '../components/Tablet.jsx';
import { createCharacter } from '../character/generate.js';
import { useSession } from '../SessionContext.jsx';

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
        <div className="name-screen">
          <img className="name-screen__unknown" src="/ui/unknown.svg" alt="아직 정해지지 않은 모이모" />

          <form className="name-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="name-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름이 머야?"
              maxLength={12}
              autoComplete="off"
              aria-label="이름"
            />
            <button className="button button--pink" type="submit" disabled={!name.trim()}>
              눌러바
            </button>
          </form>
        </div>
      </Tablet>
    </Layout>
  );
}

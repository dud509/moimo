// ============================================================
// 1번째 화면 : 이름 입력
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    <main className="screen screen--center name-page">
      <div className="name-page__blobs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="stack stack--center">
        <p className="eyebrow">졸업전시 · moimo</p>
        <h1 className="display">모이모</h1>
        <p className="lead">
          이름을 알려주세요.
          <br />
          당신만의 모이모가 태어납니다.
        </p>

        <form className="name-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="name-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름을 입력해 주세요"
            maxLength={12}
            autoComplete="off"
            aria-label="이름"
          />
          <button className="button button--primary" type="submit" disabled={!name.trim()}>
            모이모 만나기
          </button>
        </form>
      </div>

      <Link className="corner-link" to="/gallery">
        모두의 모이모 보기 →
      </Link>
    </main>
  );
}

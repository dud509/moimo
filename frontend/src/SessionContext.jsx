// ============================================================
// 화면과 화면 사이에 정보를 들고 다니는 상자
//
// 이름 입력 화면에서 만든 캐릭터를, 사진 찍는 화면과 결과 화면에서도
// 써야 하기 때문에 여기에 잠깐 담아둡니다.
// (전시 방문자가 바뀌면 처음으로 돌아가면서 비워집니다.)
// ============================================================

import { createContext, useContext, useMemo, useState } from 'react';

const EMPTY = { name: '', character: null, photo: null };

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(EMPTY);

  const value = useMemo(
    () => ({
      session,
      /** 캐릭터가 태어났을 때 저장 */
      startWith(name, character) {
        setSession({ name, character, photo: null });
      },
      /** 사진을 찍었을 때 저장 */
      setPhoto(photo) {
        setSession((prev) => ({ ...prev, photo }));
      },
      /** 다음 방문자를 위해 모두 비우기 */
      reset() {
        setSession(EMPTY);
      },
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession 은 SessionProvider 안에서만 쓸 수 있습니다.');
  return context;
}

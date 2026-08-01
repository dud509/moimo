// ============================================================
// 캐릭터 결과 화면 오른쪽에 세로로 붙는 메뉴 (피그마 Desktop-9)
//
//   📷  같이 사진 찍기
//   🖼  모카이빙
//   🛍  모이모 굿즈
// ============================================================

import { Link } from 'react-router-dom';

export const MENU_ITEMS = [
  { to: '/capture', label: '같이 사진 찍기', image: '/ui/camera.svg' },
  { to: '/gallery', label: '모카이빙', image: '/ui/polaroid.svg' },
  { to: '/goods', label: '모이모 굿즈', image: '/ui/bag.svg' },
];

export default function SideMenu() {
  return (
    <nav className="side-menu">
      {MENU_ITEMS.map((item) => (
        <Link key={item.to} className="side-menu__item" to={item.to}>
          <img className="side-menu__image" src={item.image} alt="" />
          <span className="side-menu__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

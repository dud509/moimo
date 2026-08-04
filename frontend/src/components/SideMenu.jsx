// ============================================================
// 캐릭터 결과 화면 오른쪽에 세로로 붙는 메뉴 (피그마 Desktop-9)
//
//   📷  같이 사진 찍기
//   🖼  모카이빙
//   🛍  모이모 굿즈
//
// x, y, w 는 피그마에 뜨는 숫자 그대로입니다 (그림이 놓이는 자리).
// 이름표는 그림 바로 아래에 붙고, 높이는 styles.css 의 --menu-label-h 입니다.
// ============================================================

import { Link } from 'react-router-dom';

import { onDesk } from '../lib/layout.js';

export const MENU_ITEMS = [
  { to: '/capture', label: '같이 사진 찍기', image: '/ui/camera.svg', x: 2164, y: 340, w: 182 },
  { to: '/gallery', label: '모카이빙', image: '/ui/polaroid.svg', x: 2160, y: 685, w: 188 },
  { to: '/goods', label: '모이모 굿즈', image: '/ui/bag.svg', x: 2162, y: 1030, w: 183 },
];

export default function SideMenu() {
  return (
    <nav className="side-menu">
      {MENU_ITEMS.map((item) => (
        <Link key={item.to} className="side-menu__item" to={item.to} style={onDesk(item)}>
          <img className="side-menu__image" src={item.image} alt="" />
          <span className="side-menu__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

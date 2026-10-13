import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '기록으로 이어가는 사람 | Personal Archive', description: '배움, 실천, 회고를 연결하는 개인 브랜딩 아카이브' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}</body></html> }

import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BottomNav() {
  const router = useRouter();

  const navItems = [
    { path: '/', label: 'Portfolio', icon: '📊' },
    { path: '/logs', label: 'Activity', icon: '📝' },
    { path: '/docs', label: 'Guide', icon: '📚' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-blur"></div>
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 80px;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .bottom-nav-blur {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.72);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          backdrop-filter: saturate(180%) blur(20px);
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }

        @media (prefers-color-scheme: dark) {
          .bottom-nav-blur {
            background: rgba(28, 28, 30, 0.72);
            border-top-color: rgba(255, 255, 255, 0.08);
          }
        }

        .bottom-nav-content {
          position: relative;
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 20px;
          color: #8e8e93;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
          min-width: 70px;
        }

        .nav-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .nav-item.active {
          color: #007aff;
        }

        @media (prefers-color-scheme: dark) {
          .nav-item {
            color: #98989d;
          }

          .nav-item:hover {
            background: rgba(255, 255, 255, 0.08);
          }

          .nav-item.active {
            color: #0a84ff;
          }
        }

        .nav-icon {
          font-size: 26px;
          line-height: 1;
        }

        .nav-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        @media (max-width: 640px) {
          .nav-item {
            padding: 6px 12px;
            min-width: 60px;
          }

          .nav-icon {
            font-size: 24px;
          }

          .nav-label {
            font-size: 10px;
          }
        }
      `}</style>
    </nav>
  );
}

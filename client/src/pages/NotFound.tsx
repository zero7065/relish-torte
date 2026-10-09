import { Link } from 'react-router-dom';
import { useTitle } from '../lib/useTitle';

export default function NotFound() {
  useTitle('Page not found — Relish Torte');
  return (
    <div className="section container-x text-center">
      <p className="font-display text-7xl font-semibold text-clay/30">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">This page slipped off the cake stand</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/60">
        The page you are looking for does not exist. The menu, however, very much does.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/" className="btn btn-primary">
          Back home
        </Link>
        <Link to="/menu" className="btn btn-outline">
          Browse the menu
        </Link>
      </div>
    </div>
  );
}

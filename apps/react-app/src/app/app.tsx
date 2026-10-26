import { Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { useMfeBridge } from './use-mfe-bridge';

function Home({ user, onEmit }: { user?: string; onEmit: () => void }) {
  return (
    <>
      <h2>React · Home</h2>
      <p>Hello {user ?? 'stranger'}.</p>
      <button onClick={onEmit}>Emit event to shell</button>
    </>
  );
}

function Products() {
  return (
    <>
      <h2>React · Products</h2>
      <ul>
        {['keyboard', 'mouse', 'monitor'].map((id) => (
          <li key={id}>
            <Link to={`/products/${id}`}>{id}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function ProductDetail() {
  const { id } = useParams();
  return (
    <>
      <h2>React · {id}</h2>
      <Link to="/products">← back to products</Link>
    </>
  );
}

export function App() {
  const mfe = useMfeBridge('react-app');

  return (
    <>
      <nav className="nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        {!mfe.embedded && <small>(standalone)</small>}
      </nav>
      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                user={mfe.context?.user?.name}
                onEmit={() => mfe.emit('cart:item-added', { sku: 'keyboard', qty: 1 })}
              />
            }
          />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;

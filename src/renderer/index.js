import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('PrintFlow Lite error:', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#060612', color:'#fff', fontFamily:'-apple-system,sans-serif', padding:40 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Something went wrong</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:24, textAlign:'center', maxWidth:400 }}>
          {this.state.error?.message || 'An unexpected error occurred'}
        </div>
        <button onClick={() => window.location.reload()} style={{ padding:'10px 24px', background:'#0071E3', color:'#fff', border:'none', borderRadius:10, fontSize:14, cursor:'pointer' }}>
          Restart App
        </button>
      </div>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

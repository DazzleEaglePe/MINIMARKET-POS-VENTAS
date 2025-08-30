import React from "react";

/* eslint-disable react/prop-types */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("UI ErrorBoundary caught: ", error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{display:'grid',placeItems:'center',height:'100vh',color:'#ff4d4f',textAlign:'center',padding:'16px'}}>
          <div>
            <h2>Ocurrió un error en la interfaz</h2>
            <p style={{color:'#888'}}>Intentaremos recuperarnos. Puedes recargar la página.</p>
            <button onClick={this.handleReload} style={{padding:'10px 16px',borderRadius:8,border:'1px solid #ccc',cursor:'pointer'}}>Recargar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

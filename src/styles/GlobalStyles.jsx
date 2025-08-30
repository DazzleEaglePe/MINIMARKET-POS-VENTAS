import { createGlobalStyle } from "styled-components";
export const GlobalStyles = createGlobalStyle`
    body{
        margin:0;
        padding:0;
        box-sizing:border-box;
        background-color:${({ theme }) => theme.bgtotal};
        font-family:"Poppins",sans-serif;
        color:#fff;
    }
    
    body::-webkit-scrollbar {
  width: 12px;
  background: rgba(24, 24, 24, 0.2);
}

body::-webkit-scrollbar-thumb {
  background: rgba(148, 148, 148, 0.9);
  border-radius: 10px;
  filter: blur(10px);
}

    /* SweetAlert2 - modern, theme-aware styling */
    .swal2-container {
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      padding: 16px;
    }

    .swal2-popup {
      background: ${({ theme }) => theme.bgcards};
      color: ${({ theme }) => theme.text};
      border: 1px solid ${({ theme }) => theme.color2};
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2), ${({ theme }) => theme.boxshadow};
      width: min(480px, 92vw);
      padding: 20px 22px 18px;
    }

    .swal2-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: ${({ theme }) => theme.text};
      letter-spacing: 0.2px;
    }

    .swal2-html-container {
      color: ${({ theme }) => theme.colorSubtitle};
      font-size: 0.95rem;
      margin-top: 6px;
    }

    .swal2-actions {
      gap: 10px;
      margin-top: 18px;
    }

    .swal2-styled {
      border-radius: 999px !important;
      padding: 10px 16px !important;
      font-weight: 800 !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      transition: transform .08s ease, box-shadow .2s ease, background .2s ease, color .2s ease, border-color .2s ease;
    }

    .swal2-styled:focus-visible {
      outline: 3px solid ${({ theme }) => theme.bg5};
      outline-offset: 2px;
    }

    .swal2-confirm {
      background: linear-gradient(180deg, ${({ theme }) => theme.color1} 0%, rgba(28,176,246,0.85) 100%) !important;
      color: #fff !important;
      border: none !important;
    }
    .swal2-confirm:hover { filter: brightness(1.05); box-shadow: 0 4px 12px rgba(28,176,246,0.35);} 
    .swal2-confirm:active { transform: translateY(1px); }

    .swal2-cancel {
      background: transparent !important;
      color: ${({ theme }) => theme.text} !important;
      border: 1.5px solid ${({ theme }) => theme.color2} !important;
    }
    .swal2-cancel:hover { background: ${({ theme }) => theme.bgAlpha} !important; }
    .swal2-cancel:active { transform: translateY(1px); }

    /* Variant: logout (danger) */
    .swal2-logout {
      background: linear-gradient(180deg, #ff4d4f 0%, rgba(255,77,79,0.85) 100%) !important;
      color: #fff !important;
      border: none !important;
    }
    .swal2-logout:hover { filter: brightness(1.05); box-shadow: 0 4px 12px rgba(255,77,79,0.35);} 
    .swal2-logout:active { transform: translateY(1px); }

    /* Variant: danger (generic destructive) */
    .swal2-danger {
      background: linear-gradient(180deg, #ff4d4f 0%, rgba(255,77,79,0.85) 100%) !important;
      color: #fff !important;
      border: none !important;
    }
    .swal2-danger:hover { filter: brightness(1.05); box-shadow: 0 4px 12px rgba(255,77,79,0.35);} 
    .swal2-danger:active { transform: translateY(1px); }

    .swal2-icon { transform: scale(.9); }
    .swal2-icon-content { font-size: 2.2rem; }

    /* Animations */
    @keyframes swalIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
    @keyframes swalOut { from { transform: scale(1); opacity: 1 } to { transform: scale(.98); opacity: 0 } }
    .swal2-popup.swal2-show { animation: swalIn 160ms ease-out; }
    .swal2-popup.swal2-hide { animation: swalOut 140ms ease-in forwards; }

`;

import React, { useEffect, useState } from 'react';

const Loader = ({ onLoadComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Add the CSS animations to the document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        0% {
          transform: scale(1);
          box-shadow: rgba(0, 0, 0, 0.3) 0 10px 10px 0;
        }
        50% {
          transform: scale(1.3);
          box-shadow: rgba(0, 0, 0, 0.3) 0 30px 20px 0;
        }
        100% {
          transform: scale(1);
          box-shadow: rgba(0, 0, 0, 0.3) 0 10px 10px 0;
        }
      }
      
      @keyframes color-change {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
      
      .ripple-animation {
        animation: ripple 2s infinite ease-in-out;
      }
      
      .color-change-animation {
        animation: color-change 2s infinite ease-in-out;
      }
    `;
    document.head.appendChild(style);

    // Simulate loading completion after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadComplete) {
        setTimeout(onLoadComplete, 500);
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      // Clean up the style element
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [onLoadComplete]);

  if (!isVisible) return null;

  return (
    <div className="bg-black fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999 }}>
      <div className="relative flex items-center justify-center" style={{ height: '250px', aspectRatio: '1' }}>
        
        {/* Logo - positioned absolute, centered */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center color-change-animation"
          style={{ 
            width: '60px', 
            height: '60px',
            zIndex: 999
          }}
        >
          <svg 
            viewBox="0 -0.5 25 25" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M16.5 12L13 14.333V19L20 14.333V9.667L13 5V9.667L16.5 12Z" 
              stroke="#ffffff" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M6.41598 9.04293C6.07132 8.81319 5.60568 8.90635 5.37593 9.25102C5.14619 9.59568 5.23935 10.0613 5.58402 10.2911L6.41598 9.04293ZM12.584 14.9571C12.9287 15.1868 13.3943 15.0936 13.6241 14.749C13.8538 14.4043 13.7606 13.9387 13.416 13.7089L12.584 14.9571ZM6.75 9.667C6.75 9.25279 6.41421 8.917 6 8.917C5.58579 8.917 5.25 9.25279 5.25 9.667H6.75ZM5.25 14.333C5.25 14.7472 5.58579 15.083 6 15.083C6.41421 15.083 6.75 14.7472 6.75 14.333H5.25ZM5.58395 9.04298C5.23932 9.27275 5.1462 9.73841 5.37598 10.083C5.60575 10.4277 6.07141 10.5208 6.41605 10.291L5.58395 9.04298ZM13.416 5.62402C13.7607 5.39425 13.8538 4.92859 13.624 4.58395C13.3942 4.23932 12.9286 4.1462 12.584 4.37598L13.416 5.62402ZM13.416 10.2911C13.7606 10.0613 13.8538 9.59568 13.6241 9.25102C13.3943 8.90635 12.9287 8.81319 12.584 9.04293L13.416 10.2911ZM5.58402 13.7089C5.23935 13.9387 5.14619 14.4043 5.37593 14.749C5.60568 15.0936 6.07132 15.1868 6.41598 14.9571L5.58402 13.7089ZM6.41605 13.709C6.07141 13.4792 5.60575 13.5723 5.37598 13.917C5.1462 14.2616 5.23932 14.7272 5.58395 14.957L6.41605 13.709ZM12.584 19.624C12.9286 19.8538 13.3942 19.7607 13.624 19.416C13.8538 19.0714 13.7607 18.6058 13.416 18.376L12.584 19.624ZM20.416 10.2911C20.7606 10.0613 20.8538 9.59568 20.6241 9.25102C20.3943 8.90635 19.9287 8.81319 19.584 9.04293L20.416 10.2911ZM16.5 12L16.084 11.3759C15.8753 11.515 15.75 11.7492 15.75 12C15.75 12.2508 15.8753 12.485 16.084 12.6241L16.5 12ZM19.584 14.9571C19.9287 15.1868 20.3943 15.0936 20.6241 14.749C20.8538 14.4043 20.7606 13.9387 20.416 13.7089L19.584 14.9571ZM5.58402 10.2911L12.584 14.9571L13.416 13.7089L6.41598 9.04293L5.58402 10.2911ZM5.25 9.667V14.333H6.75V9.667H5.25ZM6.41605 10.291L13.416 5.62402L12.584 4.37598L5.58395 9.04298L6.41605 10.291ZM12.584 9.04293L5.58402 13.7089L6.41598 14.9571L13.416 10.2911L12.584 9.04293ZM5.58395 14.957L12.584 19.624L13.416 18.376L6.41605 13.709L5.58395 14.957ZM19.584 9.04293L16.084 11.3759L16.916 12.6241L20.416 10.2911L19.584 9.04293ZM16.084 12.6241L19.584 14.9571L20.416 13.7089L16.916 11.3759L16.084 12.6241Z" 
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* Box 1 - 25% width, aspect-ratio 1:1, z-index 99 */}
        <div 
          className="absolute rounded-full border-t border-gray-400 ripple-animation"
          style={{
            width: '25%',
            aspectRatio: '1/1',
            background: 'linear-gradient(0deg, rgba(50, 50, 50, 0.2) 0%, rgba(100, 100, 100, 0.2) 100%)',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0 10px 10px 0',
            backdropFilter: 'blur(5px)',
            zIndex: 99
          }}
        />

        {/* Box 2 - inset 30%, z-index 98, animation delay 0.2s */}
        <div 
          className="absolute rounded-full ripple-animation"
          style={{
            inset: '30%',
            background: 'linear-gradient(0deg, rgba(50, 50, 50, 0.2) 0%, rgba(100, 100, 100, 0.2) 100%)',
            borderTop: '1px solid rgba(100, 100, 100, 0.8)',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0 10px 10px 0',
            backdropFilter: 'blur(5px)',
            animationDelay: '0.2s',
            zIndex: 98
          }}
        />

        {/* Box 3 - inset 20%, z-index 97, animation delay 0.4s */}
        <div 
          className="absolute rounded-full ripple-animation"
          style={{
            inset: '20%',
            background: 'linear-gradient(0deg, rgba(50, 50, 50, 0.2) 0%, rgba(100, 100, 100, 0.2) 100%)',
            borderTop: '1px solid rgba(100, 100, 100, 0.6)',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0 10px 10px 0',
            backdropFilter: 'blur(5px)',
            animationDelay: '0.4s',
            zIndex: 97
          }}
        />

        {/* Box 4 - inset 10%, z-index 96, animation delay 0.6s */}
        <div 
          className="absolute rounded-full ripple-animation"
          style={{
            inset: '10%',
            background: 'linear-gradient(0deg, rgba(50, 50, 50, 0.2) 0%, rgba(100, 100, 100, 0.2) 100%)',
            borderTop: '1px solid rgba(100, 100, 100, 0.4)',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0 10px 10px 0',
            backdropFilter: 'blur(5px)',
            animationDelay: '0.6s',
            zIndex: 96
          }}
        />

        {/* Box 5 - inset 0, z-index 95, animation delay 0.8s */}
        <div 
          className="absolute rounded-full ripple-animation"
          style={{
            inset: '0',
            background: 'linear-gradient(0deg, rgba(50, 50, 50, 0.2) 0%, rgba(100, 100, 100, 0.2) 100%)',
            borderTop: '1px solid rgba(100, 100, 100, 0.2)',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0 10px 10px 0',
            backdropFilter: 'blur(5px)',
            animationDelay: '0.8s',
            zIndex: 95
          }}
        />
      </div>
    </div>
  );
};

export default Loader;
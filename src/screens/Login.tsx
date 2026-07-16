import { useState, useEffect } from 'react';
import { ScreenName } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Delete } from 'lucide-react';

interface LoginProps {
  navigate: (screen: ScreenName) => void;
  setIsAuthenticated: (val: boolean) => void;
}

export function Login({ navigate, setIsAuthenticated }: LoginProps) {
  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (passcode.length === 4) {
      if (passcode === '1111') {
        setIsAuthenticated(true);
        setTimeout(() => navigate('field'), 300);
      } else {
        setError(true);
        setTimeout(() => {
          setPasscode('');
          setError(false);
        }, 500);
      }
    }
  }, [passcode, navigate, setIsAuthenticated]);

  const handlePress = (num: string) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const padNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="h-full bg-system-bg flex flex-col items-center">
      <div className="w-full p-4 flex items-center pt-4">
        <button onClick={() => navigate('home')} className="p-2 text-text-sub">
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center -mt-16">
        <h2 className="text-xl font-bold text-text-main mb-8">Enter Passcode</h2>
        
        <motion.div 
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-4 mb-16"
        >
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                i < passcode.length ? 'bg-text-main border-text-main' : 'border-[rgba(0,0,0,0.1)]'
              } ${error ? 'bg-red-500 border-red-500' : ''}`}
            />
          ))}
        </motion.div>

        <div className="grid grid-cols-3 gap-6 px-12">
          {padNumbers.map((item, idx) => {
            if (item === '') return <div key={idx} />;
            if (item === 'back') {
              return (
                <button 
                  key={idx}
                  onClick={handleBackspace}
                  className="w-20 h-20 flex items-center justify-center rounded-full active:bg-black/5 transition-colors"
                >
                  <Delete size={28} className="text-text-sub" />
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handlePress(item)}
                className="w-20 h-20 flex items-center justify-center text-3xl font-light text-text-main rounded-full bg-card-bg shadow-sm border border-[rgba(0,0,0,0.04)] active:bg-system-bg transition-colors"
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

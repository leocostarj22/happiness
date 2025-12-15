import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  gameCode: string;
  size?: number;
}

const QRCodeDisplay = ({ gameCode, size = 200 }: QRCodeDisplayProps) => {
  const joinUrl = `${window.location.origin}/play/${gameCode}`;

  return (
    <div className="flex flex-col items-center gap-6 animate-bounce-in">
      <div className="bg-foreground p-4 rounded-2xl glow">
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="H"
          bgColor="hsl(45, 100%, 96%)"
          fgColor="hsl(250, 20%, 8%)"
        />
      </div>
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">Ou entre com o código:</p>
        <div className="bg-card border-2 border-primary rounded-xl px-8 py-4">
          <span className="font-display text-4xl tracking-widest gradient-text">
            {gameCode}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

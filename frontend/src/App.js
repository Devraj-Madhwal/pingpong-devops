import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("AI");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let paddleHeight = 80;
    let paddleWidth = 10;

    let playerY = canvas.height / 2 - paddleHeight / 2;
    let opponentY = canvas.height / 2 - paddleHeight / 2;

    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 4;
    let ballSpeedY = 4;

    let playerScore = 0;
    let opponentScore = 0;

    const drawRect = (x, y, w, h) => {
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, w, h);
    };

    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    };

    const drawText = (text, x, y) => {
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(text, x, y);
    };

    const resetBall = () => {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeedX = -ballSpeedX;
    };

    const move = () => {
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      if (ballY <= 0 || ballY >= canvas.height) {
        ballSpeedY = -ballSpeedY;
      }

      // Player collision
      if (
        ballX <= paddleWidth &&
        ballY > playerY &&
        ballY < playerY + paddleHeight
      ) {
        ballSpeedX = -ballSpeedX;
      }

      // Opponent collision
      if (
        ballX >= canvas.width - paddleWidth &&
        ballY > opponentY &&
        ballY < opponentY + paddleHeight
      ) {
        ballSpeedX = -ballSpeedX;
      }

      // Score
      if (ballX < 0) {
        opponentScore++;
        resetBall();
      }
      if (ballX > canvas.width) {
        playerScore++;
        resetBall();
      }

      // AI movement
      if (mode === "AI") {
        opponentY += (ballY - (opponentY + paddleHeight / 2)) * 0.1;
      }
    };

    const draw = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawRect(0, playerY, paddleWidth, paddleHeight);
      drawRect(canvas.width - paddleWidth, opponentY, paddleWidth, paddleHeight);

      drawBall();
      drawText(playerScore, 100, 50);
      drawText(opponentScore, canvas.width - 100, 50);
    };

    const gameLoop = () => {
      move();
      draw();
    };

    const interval = setInterval(gameLoop, 1000 / 60);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleHeight / 2;

      socket.emit("move", { y: playerY });
    };

    const handleKey = (e) => {
      if (mode === "1v1") {
        if (e.key === "w") playerY -= 20;
        if (e.key === "s") playerY += 20;
        if (e.key === "ArrowUp") opponentY -= 20;
        if (e.key === "ArrowDown") opponentY += 20;
      }
    };

    socket.on("move", (data) => {
      opponentY = data.y;
    });

    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKey);

    return () => {
      clearInterval(interval);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKey);
    };
  }, [mode]);

  return (
    <div style={{ textAlign: "center", color: "white", background: "black", height: "100vh" }}>
      <h1>🏓 Ping Pong Game</h1>

      <button onClick={() => setMode("AI")}>AI Mode</button>
      <button onClick={() => setMode("1v1")}>1v1 Mode</button>

      <br /><br />

      <canvas ref={canvasRef} width={600} height={400} style={{ border: "1px solid white" }} />

      <p>Mouse = Move | 1v1: W/S & Arrow Keys</p>
    </div>
  );
}
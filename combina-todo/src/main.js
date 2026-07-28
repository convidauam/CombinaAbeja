import { Game } from './core/game.js';
import './style.css';

window.addEventListener('DOMContentLoaded', () => {
    console.log('🎰 CombinaBajas - Generador de Combinaciones');
    console.log('💡 Para comenzar, importa un archivo JSON o usa la demo');
    
    try {
        const game = new Game('game-canvas');
        
        if (import.meta.env.DEV) {
            window.game = game;
            console.log('🐝 Juego inicializado. Acceso global: window.game');
        }
        
        window.addEventListener('error', (event) => {
            console.error('❌ Error:', event.error);
        });
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
        
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.fillText('Error al cargar el juego', 50, 50);
        }
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
    }
});
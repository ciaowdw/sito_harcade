import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class RandomSoccer extends JPanel implements ActionListener, KeyListener {
    // Dimensioni della finestra
    private static final int WIDTH = 800;
    private static final int HEIGHT = 500;

    // Variabili della palla
    private double ballX = 400, ballY = 200;
    private double ballVX = 2, ballVY = 0;
    private final int ballRadius = 15;

    // Variabili dei giocatori (Fisica semplificata stile marionetta)
    private double p1X = 200, p1Y = 400, p1Angle = 0;
    private double p2X = 600, p2Y = 400, p2Angle = 0;
    private double p1VY = 0, p2VY = 0;
    private double p1AV = 0, p2AV = 0; // Velocità angolare

    // Punteggio
    private int scoreBlue = 0;
    private int scoreRed = 0;

    // Costanti fisiche
    private final double GRAVITY = 0.4;
    private final double BOUNCE = 0.75;

    public RandomSoccer() {
        JFrame frame = new JFrame("Random Soccer - Java Version");
        frame.setSize(WIDTH, HEIGHT);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.add(this);
        frame.addKeyListener(this);
        frame.setResizable(false);
        frame.setVisible(true);

        // Game Loop (circa 60 FPS)
        Timer timer = new Timer(16, this);
        timer.start();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Disegna Campo (Verde)
        g2.setColor(new Color(46, 204, 113));
        g2.fillRect(0, 0, WIDTH, HEIGHT);

        // Disegna Terreno (Verde Scuro)
        g2.setColor(new Color(39, 174, 96));
        g2.fillRect(0, HEIGHT - 50, WIDTH, 50);

        // Disegna Porte
        g2.setColor(Color.WHITE);
        g2.fillRect(0, HEIGHT - 180, 60, 10); // Traversa sinistra
        g2.fillRect(55, HEIGHT - 180, 5, 130); // Palo sinistro
        g2.fillRect(WIDTH - 60, HEIGHT - 180, 60, 10); // Traversa destra
        g2.fillRect(WIDTH - 60, HEIGHT - 180, 5, 130); // Palo destro

        // Tabellone Punteggio
        g2.setFont(new Font("Arial", Font.BOLD, 30));
        g2.drawString("BLU: " + scoreBlue + "  |  ROSSO: " + scoreRed, WIDTH / 2 - 130, 40);

        // Giocatore 1 (Blu) con rotazione caotica
        g2.translate(p1X, p1Y);
        g2.rotate(p1Angle);
        g2.setColor(new Color(52, 152, 219));
        g2.fillRect(-15, -40, 30, 60); // Tronco
        g2.setColor(new Color(241, 196, 15));
        g2.fillRect(-5, 20, 10, 30); // Gamba
        g2.rotate(-p1Angle);
        g2.translate(-p1X, -p1Y);

        // Giocatore 2 (Rosso) con rotazione caotica
        g2.translate(p2X, p2Y);
        g2.rotate(p2Angle);
        g2.setColor(new Color(231, 76, 60));
        g2.fillRect(-15, -40, 30, 60); // Tronco
        g2.setColor(new Color(241, 196, 15));
        g2.fillRect(-5, 20, 10, 30); // Gamba
        g2.rotate(-p2Angle);
        g2.translate(-p2X, -p2Y);

        // Disegna Palla
        g2.setColor(Color.WHITE);
        g2.fillOval((int)ballX - ballRadius, (int)ballY - ballRadius, ballRadius * 2, ballRadius * 2);
        g2.setColor(Color.BLACK);
        g2.drawOval((int)ballX - ballRadius, (int)ballY - ballRadius, ballRadius * 2, ballRadius * 2);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        // Applica gravità alla palla
        ballVY += GRAVITY;
        ballX += ballVX;
        ballY += ballVY;

        // Applica fisica ai giocatori
        p1VY += GRAVITY; p1Y += p1VY;
        p2VY += GRAVITY; p2Y += p2VY;
        
        // Smorzamento rotazione (ritorno alla normalità)
        p1Angle += p1AV; p1AV *= 0.92; p1Angle *= 0.95;
        p2Angle += p2AV; p2AV *= 0.92; p2Angle *= 0.95;

        // Collisione palla-terreno
        if (ballY > HEIGHT - 50 - ballRadius) {
            ballY = HEIGHT - 50 - ballRadius;
            ballVY = -ballVY * BOUNCE;
            ballVX *= 0.98; // Attrito
        }
        // Collisioni pareti laterali
        if (ballX < ballRadius || ballX > WIDTH - ballRadius) {
            ballVX = -ballVX * BOUNCE;
        }

        // Blocco dei giocatori sul terreno
        if (p1Y > HEIGHT - 70) { p1Y = HEIGHT - 70; p1VY = 0; }
        if (p2Y > HEIGHT - 70) { p2Y = HEIGHT - 70; p2VY = 0; }

        // Collisione Giocatore 1 - Palla (Molto semplificata e caotica)
        if (Math.hypot(ballX - p1X, ballY - p1Y) < 60) {
            ballVY = -8 - Math.random() * 4;
            ballVX = 5 + Math.random() * 5;
            p1AV = -0.5; // Effetto contraccolpo angolare
        }
        // Collisione Giocatore 2 - Palla
        if (Math.hypot(ballX - p2X, ballY - p2Y) < 60) {
            ballVY = -8 - Math.random() * 4;
            ballVX = -5 - Math.random() * 5;
            p2AV = 0.5;
        }

        // Controllo dei GOL
        if (ballY > HEIGHT - 180 && ballY < HEIGHT - 50) {
            if (ballX < 55) { scoreRed++; resetGame(); }
            if (ballX > WIDTH - 55) { scoreBlue++; resetGame(); }
        }

        repaint();
    }

    private void resetGame() {
        ballX = 400; ballY = 150;
        ballVX = (Math.random() > 0.5 ? 3 : -3); ballVY = 0;
        p1X = 200; p2X = 600;
    }

    @Override
    public void keyPressed(KeyEvent e) {
        // Tasto W - Salto Giocatore Blu
        if (e.getKeyCode() == KeyEvent.VK_W && p1Y >= HEIGHT - 71) {
            p1VY = -9;
            p1AV = 0.6; // Inclinazione in avanti brusca
        }
        // Freccia Su - Salto Giocatore Rosso
        if (e.getKeyCode() == KeyEvent.VK_UP && p2Y >= HEIGHT - 71) {
            p2VY = -9;
            p2AV = -0.6; // Inclinazione in avanti brusca
        }
    }

    @Override public void keyReleased(KeyEvent e) {}
    @Override public void keyTyped(KeyEvent e) {}

    public static void main(String[] args) {
        new RandomSoccer();
    }
}

import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        GTO Score Master — веб-калькулятор результатов ВФСК ГТО. Работает локально, без отправки данных на
        сервер.
      </p>
    </footer>
  );
}

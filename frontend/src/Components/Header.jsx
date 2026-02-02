import React from "react";
import style from "./Header.module.css";

const Header = () => {
  return (
    <header className={style.header}>
      <div className={style.leftSection}>
        {/* <button type="button" className={style.actionBtn}>
          Create folder
        </button> */}
        <button type="button" className={style.actionBtn}>
          Upload file
        </button>
      </div>
      <span className={style.appName}>MYvault</span>
    </header>
  );
};

export default Header;

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
      <div className={style.rightSection}>
        <button type="button" className={style.actionBtn}>
          Logout
        </button>
        <span className={style.appName}>MYvault</span>
      </div>
    </header>
  );
};

export default Header;

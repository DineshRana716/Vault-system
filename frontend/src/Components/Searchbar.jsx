import React from "react";
import style from "./Searchbar.module.css";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const Searchbar = () => {
  return (
    <div className={style.searchContainer}>
      <SearchOutlinedIcon className={style.icon} />
      <input type="text" placeholder="Search files" className={style.input} />
    </div>
  );
};

export default Searchbar;

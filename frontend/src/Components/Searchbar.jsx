import React, { useState } from "react";
import style from "./Searchbar.module.css";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const Searchbar = ({ onSearch }) => {
  const handleChange = (e) => {
    //console.log("typing ", e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className={style.searchContainer}>
      <SearchOutlinedIcon className={style.icon} />
      <input
        type="text"
        placeholder="Search files"
        className={style.input}
        onChange={handleChange}
      />
    </div>
  );
};

export default Searchbar;

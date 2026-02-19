import React from "react";
import style from "./Sidebar.module.css";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

const Sidebar = () => {
  return (
    <aside className={style.sidebar}>
      <div className={style.logo}>Nuvault</div>

      <div className={style.navItem}>
        <FolderOutlinedIcon className={style.icon} />
        <span>All Files</span>
      </div>

      <div className={style.navItem}>
        <AccessTimeOutlinedIcon className={style.icon} />
        <span>Recent</span>
      </div>

      <div className={style.navItem}>
        <StarBorderOutlinedIcon className={style.icon} />
        <span>Favorites</span>
      </div>

      <div className={style.navItem}>
        <DeleteOutlineOutlinedIcon className={style.icon} />
        <span>Trash</span>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Body from "../Components/Body";
import Header from "../Components/Header";
import style from "./Home.module.css";

const Home = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { folderId } = useParams();
  const currentFolderId = folderId || null;

  return (
    <div className={style.layout}>
      <Header
        currentFolderId={currentFolderId}
        onUploadSuccess={() => setRefreshTrigger((t) => t + 1)}
        onFolderCreated={() => setRefreshTrigger((t) => t + 1)}
      />
      <Body refreshTrigger={refreshTrigger} currentFolderId={currentFolderId} />
    </div>
  );
};

export default Home;

/*
 home page will consist of two parts header and body
 header will contain the buttons - create folder , upload file
 body will displays the folders and files we are currently in -if empty then displays no file in current directory
 initial home page will 
*/

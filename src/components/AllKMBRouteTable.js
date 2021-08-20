import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import SortableTable from './SortableTable';
import './AllKMBRouteTable.css';

const initialState = {
  error: null,
  isLoaded: false,
  response: null,
};

function AllKMBRouteTable() {
  const [ width, setWidth ] = useState(window.innerWidth);
  const [ allBusRouteData, setAllBusRouteData ] = useState(initialState)

  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/')
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      setAllBusRouteData({
        ...allBusRouteData,
        error: null,
        isLoaded: true,
        response: json,
      });
    })
    .catch((error) => {
      setAllBusRouteData({
        ...allBusRouteData,
        error: error,
        isLoaded: false,
        response: null,
      })
    });  
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
        window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);

  function getDisplayData() {
    let temp = [];
    let postfix = [];
    if (allBusRouteData.response) {
      for (let i = 0; i < allBusRouteData.response.data.length; i++) {
        temp.push([
          allBusRouteData.response.data[i].route,
          allBusRouteData.response.data[i].orig_tc,
          allBusRouteData.response.data[i].dest_tc,
          '',
        ])
        postfix.push([
          '',
          '',
          '',
          <><Button href={`/kmb_route/${ allBusRouteData.response.data[i].route}/${ allBusRouteData.response.data[i].bound}/${ allBusRouteData.response.data[i].service_type}`}>時間</Button></>
          ,
        ])
      }
    }
    return {
      data: temp,
      postfix: postfix,
    };
  }
  let data = getDisplayData();
  
  let config = {
    col: [
      { content: <><br />路線</>, align: "center", width: "25%", },
      { content: <><br />頭站</>, align: "center", width: "25%", },
      { content: <><br />尾站</>, align: "center", width: "25%", },
      { content: "時間", align: "center", width: "25%", },
    ],
  };
  let filter = {
    col: [
      { text: "路線", type: "match", clear: false},
      { text: "頭站", type: "match", clear: false},
      { text: "尾站", type: "match", clear: false},
      { text: "", type: "", clear: false},
    ],
  };
  if (width > 1024) {
    config = {
      col: [
        { content: "路線", align: "center", width: "25%", },
        { content: "頭站", align: "center", width: "25%", },
        { content: "尾站", align: "center", width: "25%", },
        { content: "時間", align: "center", width: "25%", },
      ],
    };
    filter = {
      col: [
        { text: "路線", type: "match", clear: true},
        { text: "頭站", type: "match", clear: true},
        { text: "尾站", type: "match", clear: true},
        { text: "", type: "", clear: false},
      ],
    };
  }
  let sort = {
    col: [
      { type: "string" },
      { type: "string" },
      { type: "string" },
      { type: "" },
    ],
    colIndex: 0,
    asc: true,
  };
  return (
    <>
      <h1>所有九巴路線</h1>
      <SortableTable config={config} sort={sort} data={data} filter={filter}></SortableTable>
    </>
  );
}

export default AllKMBRouteTable;

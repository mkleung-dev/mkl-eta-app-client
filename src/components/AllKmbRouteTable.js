import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import SortableTable from './SortableTable';
import './KmbRouteETATable.css';

const initialState = {
  error: null,
  isLoaded: false,
  response: null,
};

function KmbRouteETATable() {
  const [ allBusRouteData, setAllBusRouteData ] = useState(initialState)

  useEffect(() => {
    fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/')
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      setAllBusRouteData({
        ...allBusRouteData,
        error: null,
        isLoaded: true,
        response: json,
      });
    })
    .catch(function(error) {
      setAllBusRouteData({
        ...allBusRouteData,
        error: error,
        isLoaded: false,
        response: null,
      })
    });  
  }, [allBusRouteData])

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
          <><Button href={`/bus_route/${ allBusRouteData.response.data[i].route}/${ allBusRouteData.response.data[i].bound}/${ allBusRouteData.response.data[i].service_type}`}>到站時間</Button></>
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
      { content: "路線", align: "center", width: "15%", },
      { content: "頭站", align: "center", width: "35%", },
      { content: "尾站", align: "center", width: "35%", },
      { content: "到站時間", align: "center", width: "15%", },
    ],
  };
  let filter = {
    col: [
      { text: "過濾路線", type: "match", },
      { text: "過濾頭站", type: "match", },
      { text: "過濾尾站", type: "match", },
      { text: "", type: "", },
    ],
  };
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
      <SortableTable config={config} sort={sort} data={data} filter={filter}></SortableTable>
    </>
  );
}

export default KmbRouteETATable;

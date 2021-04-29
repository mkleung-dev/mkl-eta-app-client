import React, { useEffect, useState } from 'react'
import { Table, Button } from 'react-bootstrap';
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

  return (
    <Table>
      <tr>
            <th>路線</th>
            <th>頭站</th>
            <th>尾站</th>
            <th>時間</th>
        {/*
          allBusRouteData.response && (
            Object.entries(allBusRouteData.response.data[0]).map(([key, data]) => 
            <th>{key}</th>
          ))
        */}
      </tr>
      {
        allBusRouteData.response && (
        allBusRouteData.response.data.map((route, i) =>
          <tr>
            <td>{route.route}</td>
            <td>{route.orig_tc}</td>
            <td>{route.dest_tc}</td>
            <td><Button href={`/bus_route/${route.route}/${route.bound}/${route.service_type}`}>去</Button></td>
            {/*
              Object.entries(route).map(([key, data]) => 
                <td>{data}</td>
              )
            */}
          </tr>
        ))
      }
    </Table>
  );
}

export default KmbRouteETATable;

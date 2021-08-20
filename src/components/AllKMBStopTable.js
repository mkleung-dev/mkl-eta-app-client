import React, { useEffect, useState } from 'react'
import { Table } from 'react-bootstrap';
import './AllKMBStopTable.css';

const initialState = {
  error: null,
  isLoaded: false,
  response: null,
};

function AllKMBStopTable() {
  const [ allBusStopData, setAllBusStopData ] = useState(initialState)

  useEffect(() => {
    fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop/')
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      setAllBusStopData({
        ...allBusStopData,
        error: null,
        isLoaded: true,
        response: json,
      });
    })
    .catch(function(error) {
      setAllBusStopData({
        ...allBusStopData,
        error: error,
        isLoaded: false,
        response: null,
      })
    });  
  }, [allBusStopData])

  return (
    <Table>
      <tr>
        {
          allBusStopData.response && (
            Object.entries(allBusStopData.response.data[0]).map(([key, data]) => 
            <th>{key}</th>
          ))
        }
      </tr>
      {
        allBusStopData.response && (
          allBusStopData.response.data.map((shop, i) =>
          <tr>
            {
              Object.entries(shop).map(([key, data]) => 
                <td>{data}</td>
              )
            }
          </tr>
        ))
      }
    </Table>
  );
}

export default AllKMBStopTable;

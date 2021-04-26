import React, { useEffect, useState } from 'react'
import { Container, Table } from 'react-bootstrap';
import { useParams } from 'react-router';
import './BusRouteETATable.css';

const initialState = {
  error: null,
  isLoaded: false,
  response: null,
};

function BusRouteETATable() {
  const [ busRouteETAData, setBusRouteETAData ] = useState(initialState)
  const { route, direction, service_type } = useParams()

  const dirStr = direction ? "inbound" : "outbound";

  useEffect(() => {
    fetch('https://data.etabus.gov.hk/v1/transport/kmb/route-eta/' + route + '/' + service_type)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      setBusRouteETAData({
        ...busRouteETAData,
        error: null,
        isLoaded: true,
        response: json,
      });
    })
    .catch(function(error) {
      setBusRouteETAData({
        ...busRouteETAData,
        error: error,
        isLoaded: false,
        response: null,
      })
    });  
  }, [])

  return (
    <Table>
      <tr>
        {
          busRouteETAData.response && (
            Object.entries(busRouteETAData.response.data[0]).map(([key, data]) => 
            <th>{key}</th>
          ))
        }
      </tr>
      {
        busRouteETAData.response && (
          busRouteETAData.response.data.map((shop, i) =>
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

export default BusRouteETATable;

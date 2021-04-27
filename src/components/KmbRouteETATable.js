import React, { useEffect, useState } from 'react'
import { Container, Spinner, Table, Button } from 'react-bootstrap';
import { useParams } from 'react-router';
import './KmbRouteETATable.css';

const initialState = {
  etaLoaded: false,
  dataLoaded: false,
  error: null,
  isLoaded: false,
  response: null,
};

function KmbRouteTable() {
  const [ favouriteBuffer, setFavouriteBuffer] = useState([]);
  const [ width, setWidth ] = useState(window.innerWidth);
  const [ busRouteData, setBusRouteData ] = useState(initialState)
  const { route, bound, service_type } = useParams()

  const dirStr = (bound === "I") ? "inbound" : "outbound";

  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    let favourites = {"favourites": []};
    let favouritesString = localStorage.getItem('favourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    setFavouriteBuffer(favourites)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
        window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);

  useEffect(() => {
    if (busRouteData.dataLoaded && !busRouteData.etaLoaded) {
      setInterval(() => {
        fetch('https://data.etabus.gov.hk/v1/transport/kmb/route-eta/' + route + '/' + service_type)
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          let temp = busRouteData.response;
          for (let i = 0; i < temp.data.length; i++) {
            temp.data[i]["eta"] = [];
            for (let j = 0; j < json.data.length; j++) {
              if (json.data[j]['dir'] === bound && (''+json.data[j]['seq']) === (''+temp.data[i]['seq'])) {
                temp.data[i]["eta"].push(json.data[j]["eta"]);
              }
            }
          }
          setBusRouteData({
            ...busRouteData,
            etaLoaded: true,
            error: null,
            isLoaded: true,
            response: temp,
          });
        })
      }, 5000);
    } else if (busRouteData.response && !busRouteData.dataLoaded) {
      let promises = [];
      for (let i = 0; i < busRouteData.response.data.length; i++) {
        promises.push(fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop/' + busRouteData.response.data[i].stop));
      }
      Promise.all(promises)
      .then((responses) => Promise.all(responses.map(response => {
        if(response.ok) return response.json();
      })))
      .then(function handleData(data) {
        let temp = busRouteData.response;
        for (let i = 0; i < data.length; i++) {
          temp.data[i]["name_tc"] = data[i].data.name_tc;
        }
        setBusRouteData({
          ...busRouteData,
          dataLoaded: true,
          error: null,
          response: temp,
        });
      })
    } else if (!busRouteData.response) {
      const request = 'https://data.etabus.gov.hk/v1/transport/kmb/route-stop/' + route + '/' + dirStr + '/' + service_type;
      fetch(request)
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        setBusRouteData({
          ...busRouteData,
          error: null,
          isLoaded: true,
          response: json,
        });
        return json;
      })
      .catch(function(error) {
        setBusRouteData({
          ...busRouteData,
          error: error,
          isLoaded: false,
          response: null,
        })
      });
    } 
  }, [busRouteData])

  const toMinus = (ms => {
    return '' + parseInt(ms / 60000)
  })
  const toSecond = (ms => {
    let ans = parseInt(parseInt(ms % 60000) / 1000)
    return (ans >= 9 ? '' : '0') + ans
  })
  const addToFavourites = ((eta) => {
    let favourites = {"favourites": []};
    let favouritesString = localStorage.getItem('favourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["favourites"].length; i++) {
      if (favourites["favourites"][i].route === favourite.route &&
          favourites["favourites"][i].bound === favourite.bound &&
          favourites["favourites"][i].service_type === favourite.service_type &&
          favourites["favourites"][i].stop === favourite.stop) {
        return;
      }
    }
    favourites["favourites"].push(favourite);

    setFavouriteBuffer(favourites);
    localStorage.setItem('favourites', JSON.stringify(favourites));
  })
  const isFavourite = ((eta) => {
    let favourites = favouriteBuffer
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["favourites"].length; i++) {
      if (favourites["favourites"][i].route === favourite.route &&
          favourites["favourites"][i].bound === favourite.bound &&
          favourites["favourites"][i].service_type === favourite.service_type &&
          favourites["favourites"][i].stop === favourite.stop) {
        return true;
      }
    }
    return false;
  })
  const removeFromFavourites = ((eta) => {
    let backupFavourites = {"favourites": []};
    let favourites = {"favourites": []};
    let favouritesString = localStorage.getItem('favourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["favourites"].length; i++) {
      if (favourites["favourites"][i].route === favourite.route &&
          favourites["favourites"][i].bound === favourite.bound &&
          favourites["favourites"][i].service_type === favourite.service_type &&
          favourites["favourites"][i].stop === favourite.stop) {
      } else {
        backupFavourites["favourites"].push(favourites["favourites"][i]);
      }
    }
    setFavouriteBuffer(backupFavourites);
    localStorage.setItem('favourites', JSON.stringify(backupFavourites));
  })

  return (
    <Table>
      <tr>
        <th>最愛</th>
        <th>巴士站</th>
        <th>下一班時間</th>
        <th>等候時間</th>
        { width > 1024 &&
          <>
            <th>下二班時間</th>
            <th>等候時間</th>
            <th>下三班時間</th>
            <th>等候時間</th>
          </>
        }
        {/*
          busRouteData.response && (
            Object.entries(busRouteData.response.data[0]).map(([key, data]) => 
            <th>{key}</th>
          ))
          */}
      </tr>
      {
        busRouteData.response && (
          busRouteData.response.data.map((stop, i) =>
          <tr>
            <td>
              { !isFavourite(stop) ? 
                  <Button onClick={() => addToFavourites(stop)}>加入</Button>
                :
                <Button onClick={() => removeFromFavourites(stop)}>移除</Button>
              }
            </td>
            <td>{stop.name_tc}</td>
            { stop.eta ? (stop.eta.map((eta, j) => 
              (width > 1024 || j === 0) &&
                <>
                  <td>{(new Date(Date.parse(eta))).toLocaleTimeString('zh-hk')}</td>
                  <td>
                    { (Date.parse(eta) - (Date.now()) > 0 ? (
                        <>
                          {toMinus(Date.parse(eta) - Date.now())}:{toSecond(Date.parse(eta) - Date.now())}
                        </>
                      ) : (
                        <>
                          0:00
                        </>
                      )
                    )}
                  </td>
                </>
              )) : (
                <>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  {
                    width > 1024 && (
                      <>
                        <td>
                          <Spinner animation="border" />
                        </td>
                        <td>
                          <Spinner animation="border" />
                        </td>
                        <td>
                          <Spinner animation="border" />
                        </td>
                        <td>
                          <Spinner animation="border" />
                        </td>
                      </>
                    )
                  }
                </>
              )
            }
            {/*
              Object.entries(shop).map(([key, data]) => 
                <td>{data}</td>
              )
            */}
          </tr>
        ))
      }
    </Table>
  );
}

export default KmbRouteTable;

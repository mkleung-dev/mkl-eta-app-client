import React, { useEffect, useState } from 'react'
import { Spinner, Table, Button } from 'react-bootstrap';
import { useParams } from 'react-router';
import './KmbRouteETATable.css';

const initialState = {
  etaLoaded: false,
  dataLoaded: false,
  error: null,
  isLoaded: false,
  response: null,
};

function KmbRouteETATable() {
  const [ favouriteBuffer, setFavouriteBuffer] = useState({"KmbFavourites": []});
  const [ width, setWidth ] = useState(window.innerWidth);
  const [ busRouteData, setBusRouteData ] = useState(initialState)
  const { route, bound, service_type } = useParams()

  const dirStr = (bound === "I") ? "inbound" : "outbound";

  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    let favourites = {"KmbFavourites": []};
    let favouritesString = localStorage.getItem('KmbFavourites');
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
    let favourites = {"KmbFavourites": []};
    let favouritesString = localStorage.getItem('KmbFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["KmbFavourites"].length; i++) {
      if (favourites["KmbFavourites"][i].route === favourite.route &&
          favourites["KmbFavourites"][i].bound === favourite.bound &&
          favourites["KmbFavourites"][i].service_type === favourite.service_type &&
          favourites["KmbFavourites"][i].stop === favourite.stop) {
        return;
      }
    }
    favourites["KmbFavourites"].push(favourite);

    setFavouriteBuffer(favourites);
    localStorage.setItem('KmbFavourites', JSON.stringify(favourites));
  })
  const isFavourite = ((eta) => {
    let favourites = favouriteBuffer
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["KmbFavourites"].length; i++) {
      if (favourites["KmbFavourites"][i].route === favourite.route &&
          favourites["KmbFavourites"][i].bound === favourite.bound &&
          favourites["KmbFavourites"][i].service_type === favourite.service_type &&
          favourites["KmbFavourites"][i].stop === favourite.stop) {
        return true;
      }
    }
    return false;
  })
  const removeFromFavourites = ((eta) => {
    let backupFavourites = {"KmbFavourites": []};
    let favourites = {"KmbFavourites": []};
    let favouritesString = localStorage.getItem('KmbFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["KmbFavourites"].length; i++) {
      if (favourites["KmbFavourites"][i].route === favourite.route &&
          favourites["KmbFavourites"][i].bound === favourite.bound &&
          favourites["KmbFavourites"][i].service_type === favourite.service_type &&
          favourites["KmbFavourites"][i].stop === favourite.stop) {
      } else {
        backupFavourites["KmbFavourites"].push(favourites["KmbFavourites"][i]);
      }
    }
    setFavouriteBuffer(backupFavourites);
    localStorage.setItem('KmbFavourites', JSON.stringify(backupFavourites));
  })

  return (
    <Table>
      <tr>
      <th colSpan={width > 1024 ? 5 : 3}>路線　{route}</th>
      </tr>
      <tr>
        <th>巴士站</th>
        <th>下一班</th>
        { width > 1024 &&
          <>
            <th>第二班</th>
            <th>第三班</th>
          </>
        }
        <th>最愛</th>
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
            <td>{stop.name_tc}</td>
            { stop.eta ? (
                <>
                { stop.eta[0] ? (
                  <td>{(new Date(Date.parse(stop.eta[0]))).toLocaleTimeString('zh-hk', {hour12: false})}
                    <br />還剩　
                    { (Date.parse(stop.eta[0]) - (Date.now()) > 0 ? (
                        <>
                          {toMinus(Date.parse(stop.eta[0]) - Date.now())}:{toSecond(Date.parse(stop.eta[0]) - Date.now())}
                        </>
                      ) : (
                        <>
                          0:00
                        </>
                      )
                    )}
                  </td>
                ) : (
                  <td>
                  </td>
                )}
                {width > 1024 && (
                  <>
                    { stop.eta[1] ? (
                      <td>{(new Date(Date.parse(stop.eta[0]))).toLocaleTimeString('zh-hk', {hour12: false})}
                        <br />還剩　
                        { (Date.parse(stop.eta[0]) - (Date.now()) > 0 ? (
                            <>
                              {toMinus(Date.parse(stop.eta[0]) - Date.now())}:{toSecond(Date.parse(stop.eta[0]) - Date.now())}
                            </>
                          ) : (
                            <>
                              0:00
                            </>
                          )
                        )}
                      </td>
                    ) : (
                      <td>
                      </td>
                    )}
                    { stop.eta[2] ? (
                      <td>{(new Date(Date.parse(stop.eta[0]))).toLocaleTimeString('zh-hk', {hour12: false})}
                        <br />還剩　
                        { (Date.parse(stop.eta[0]) - (Date.now()) > 0 ? (
                            <>
                              {toMinus(Date.parse(stop.eta[0]) - Date.now())}:{toSecond(Date.parse(stop.eta[0]) - Date.now())}
                            </>
                          ) : (
                            <>
                              0:00
                            </>
                          )
                        )}
                      </td>
                    ) : (
                      <td>
                      </td>
                    )}
                  </>
                )}
                </>
              ) : (
                <>
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
                      </>
                    )
                  }
                </>
              )
            }
            <td>
              { !isFavourite(stop) ? 
                  <Button onClick={() => addToFavourites(stop)}>＋</Button>
                :
                <Button onClick={() => removeFromFavourites(stop)}>－</Button>
              }
            </td>
          </tr>
        ))
      }
    </Table>
  );
}

export default KmbRouteETATable;

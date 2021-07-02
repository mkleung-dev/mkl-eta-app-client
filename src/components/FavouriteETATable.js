import React, { useEffect, useState } from 'react'
import { Container, Spinner, Table, Button } from 'react-bootstrap';
import { useParams } from 'react-router';
import './FavouriteETATable.css';

// let favourite = {
//   "route": eta.route,
//   "bound": eta.bound,
//   "service_type": eta.service_type,
//   "stop": eta.stop};

function FavouriteETATable() {
  const [ width, setWidth ] = useState(window.innerWidth);
  const [ fetchState, setFetchState ] = useState(0);
  const [ etaData, setEtaData ] = useState({data: []});
  const [ nameMap, setNameMap ] = useState({data: {}});

  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
        window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);

  const fetchStop = (() => {
    let favourites = {"KmbFavourites": []};
    let favouritesString = localStorage.getItem('KmbFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favouriteBuffer = favourites;
    let requests = [];
    for (let i = 0; i < favouriteBuffer["KmbFavourites"].length; i++) {
      let temp = 'https://data.etabus.gov.hk/v1/transport/kmb/stop/' + favouriteBuffer["KmbFavourites"][i].stop;
      let add = true;
      for (let j = 0; j < requests.length; j++) {
        if (temp === requests[j]) {
          add = false;
        }
      }
      if (add) {
        requests.push(temp)
      }
    }
    let promises = [];
    for (let j = 0; j < requests.length; j++) {
      promises.push(fetch(requests[j]));
    }
    Promise.all(promises)
    .then((responses) => Promise.all(responses.map(response => {
      if(response.ok) return response.json();
    })))
    .then(function handleData(data) {
      let dict = {};
      for (let i = 0; i < data.length; i++) {
        dict[data[i].data.stop] = {"name_tc": data[i].data.name_tc};
      }
      if (data.length > 0) {
        setNameMap({
          data: dict,
        });
        setFetchState(1)
      }
    })
  })

  const fetchEta = ((update) => {
    let favourites = {"KmbFavourites": []};
    let favouritesString = localStorage.getItem('KmbFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favouriteBuffer = favourites;
    let requests = [];
    for (let i = 0; i < favouriteBuffer["KmbFavourites"].length; i++) {
      let temp = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/' + 
                 favouriteBuffer["KmbFavourites"][i].stop + '/' + 
                 favouriteBuffer["KmbFavourites"][i].route + '/' + 
                 favouriteBuffer["KmbFavourites"][i].service_type;
      requests.push(temp)
    }
    let promises = [];
    for (let j = 0; j < requests.length; j++) {
      promises.push(fetch(requests[j]));
    }
    Promise.all(promises)
    .then((responses) => Promise.all(responses.map(response => {
      if(response.ok) return response.json();
    })))
    .then(function handleData(data) {
      let wholeEta = [];
      for (let i = 0; i < favouriteBuffer["KmbFavourites"].length; i++) {
        let etaRow = favouriteBuffer["KmbFavourites"][i];
        
        etaRow["stop_tc"] = nameMap.data[favouriteBuffer["KmbFavourites"][i].stop].name_tc;
        etaRow["eta"] = [];
        
        for (let k = 0; k < data[i].data.length; k++) {
          if (data[i].data[k].dir === etaRow.bound) {
            etaRow["dest_tc"] = data[i].data[k].dest_tc;
            etaRow["eta"].push(data[i].data[k].eta);
          }
        }
        wholeEta.push(etaRow)
      }
      setEtaData({data: wholeEta});
      setFetchState(2)
      if (update) {
        setTimeout(() => fetchEta(true), 10000);
      }
    })
  })

  useEffect(() => {
    if (fetchState === 0) {
      fetchStop();
    } else if (fetchState === 1) {
      fetchEta(true);
    }
  }, [fetchState])

  const toMinus = (ms => {
    return '' + parseInt(ms / 60000)
  })
  const toSecond = (ms => {
    let ans = parseInt(parseInt(ms % 60000) / 1000)
    return (ans >= 9 ? '' : '0') + ans
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
    localStorage.setItem('KmbFavourites', JSON.stringify(backupFavourites));
    fetchEta(false);
  })

  return (
    <Table>
      <tr>
        <th>路線</th>
        <th>下一班</th>
        { width > 1024 &&
          <>
            <th>第二班</th>
            <th>第三班</th>
          </>
        }
        <th>移除</th>
      </tr>
      {
        etaData.data.map((stop, i) =>
          <tr>
            <td>
              {stop.stop_tc && (<>{stop.stop_tc}</>)}
              <b>{stop.route}</b>
              <br />往{stop.dest_tc}
            </td>
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
              <Button onClick={() => removeFromFavourites(stop)}>X</Button>
            </td>
          </tr>
        )
      }
    </Table>
  );
}

export default FavouriteETATable;

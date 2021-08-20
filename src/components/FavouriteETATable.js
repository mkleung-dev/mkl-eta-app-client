import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap';
import SortableTable from './SortableTable';
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
    let favourites = {"KMBFavourites": []};
    let favouritesString = localStorage.getItem('KMBFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favouriteBuffer = favourites;
    let requests = [];
    for (let i = 0; i < favouriteBuffer["KMBFavourites"].length; i++) {
      let temp = 'https://data.etabus.gov.hk/v1/transport/kmb/stop/' + favouriteBuffer["KMBFavourites"][i].stop;
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
      return response.json();
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
    let favourites = {"KMBFavourites": []};
    let favouritesString = localStorage.getItem('KMBFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favouriteBuffer = favourites;
    let requests = [];
    for (let i = 0; i < favouriteBuffer["KMBFavourites"].length; i++) {
      let temp = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/' + 
                 favouriteBuffer["KMBFavourites"][i].stop + '/' + 
                 favouriteBuffer["KMBFavourites"][i].route + '/' + 
                 favouriteBuffer["KMBFavourites"][i].service_type;
      requests.push(temp)
    }
    let promises = [];
    for (let j = 0; j < requests.length; j++) {
      promises.push(fetch(requests[j]));
    }
    Promise.all(promises)
    .then((responses) => Promise.all(responses.map(response => {
      return response.json();
    })))
    .then(function handleData(data) {
      let wholeEta = [];
      for (let i = 0; i < favouriteBuffer["KMBFavourites"].length; i++) {
        let etaRow = favouriteBuffer["KMBFavourites"][i];
        
        etaRow["stop_tc"] = nameMap.data[favouriteBuffer["KMBFavourites"][i].stop].name_tc;
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
    let backupFavourites = {"KMBFavourites": []};
    let favourites = {"KMBFavourites": []};
    let favouritesString = localStorage.getItem('KMBFavourites');
    if (favouritesString) {
      favourites = JSON.parse(favouritesString)
    }
    let favourite = {
      "route": eta.route,
      "bound": eta.bound,
      "service_type": eta.service_type,
      "stop": eta.stop};

    for (let i = 0; i < favourites["KMBFavourites"].length; i++) {
      if (favourites["KMBFavourites"][i].route === favourite.route &&
          favourites["KMBFavourites"][i].bound === favourite.bound &&
          favourites["KMBFavourites"][i].service_type === favourite.service_type &&
          favourites["KMBFavourites"][i].stop === favourite.stop) {
      } else {
        backupFavourites["KMBFavourites"].push(favourites["KMBFavourites"][i]);
      }
    }
    localStorage.setItem('KMBFavourites', JSON.stringify(backupFavourites));
    fetchEta(false);
  })

  function getDisplayData() {
    let temp = [];
    let postfix = [];
    if (etaData) {
      for (let i = 0; i < etaData.data.length; i++) {
        let stop = etaData.data[i];

        let data0 = <>
          {stop.stop_tc && (<>{stop.stop_tc}</>)}
          <b>{stop.route}</b>
          <br />往{stop.dest_tc}
        </>;

        let data1 = "";
        let data2 = "";
        let data3 = "";
        let data4 = "";
        let postfix0 = "";
        let postfix1 = "";
        let postfix2 = "";
        let postfix3 = "";
        let postfix4 = "";

        if (stop.eta && stop.eta[0]) {
          data1 = <>
          {(
            new Date(Date.parse(stop.eta[0]))).toLocaleTimeString('zh-hk', {hour12: false})}
            <br />還剩　
            {
              (
                Date.parse(stop.eta[0]) - (Date.now()) > 0 ? (
                <>
                  {toMinus(Date.parse(stop.eta[0]) - Date.now())}:{toSecond(Date.parse(stop.eta[0]) - Date.now())}
                </>
                ) : (
                  <>
                    0:00
                  </>
                )
              )
            }
          </>;
        }

        if (stop.eta && stop.eta[1]) {
          data2 = <>
          {(
            new Date(Date.parse(stop.eta[1]))).toLocaleTimeString('zh-hk', {hour12: false})}
            <br />還剩　
            {
              (
                Date.parse(stop.eta[1]) - (Date.now()) > 0 ? (
                <>
                  {toMinus(Date.parse(stop.eta[1]) - Date.now())}:{toSecond(Date.parse(stop.eta[1]) - Date.now())}
                </>
                ) : (
                  <>
                    0:00
                  </>
                )
              )
            }
          </>;
        } 

        if (stop.eta && stop.eta[2]) {
          data3 = <>
          {(
            new Date(Date.parse(stop.eta[2]))).toLocaleTimeString('zh-hk', {hour12: false})}
            <br />還剩　
            {
              (
                Date.parse(stop.eta[2]) - (Date.now()) > 0 ? (
                <>
                  {toMinus(Date.parse(stop.eta[2]) - Date.now())}:{toSecond(Date.parse(stop.eta[2]) - Date.now())}
                </>
                ) : (
                  <>
                    0:00
                  </>
                )
              )
            }
          </>;
        }
        postfix4 = <Button onClick={() => removeFromFavourites(stop)}>X</Button>
        
        if (width > 1024) {
          temp.push([
            data0,
            data1,
            data2,
            data3,
            data4,
          ])
          postfix.push([
            postfix0,
            postfix1,
            postfix2,
            postfix3,
            postfix4,
          ])
        } else {
          temp.push([
            data0,
            data1,
            data4,
          ])
          postfix.push([
            postfix0,
            postfix1,
            postfix4,
          ])
        }
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
      { content: "路線", align: "center", width: "30%", },
      { content: "下一班", align: "center", width: "30%", },
      { content: "移除", align: "center", width: "20%", },
    ],
  };
  if (width > 1024) {
    config = {
      col: [
        { content: "路線", align: "center", width: "20%", },
        { content: "下一班", align: "center", width: "20%", },
        { content: "第二班", align: "center", width: "20%", },
        { content: "第三班", align: "center", width: "20%", },
        { content: "移除", align: "center", width: "10%", },
      ],
    };
    
  }

  return (
    <>
      <h1>最愛路線</h1>
      <SortableTable config={config} data={data}></SortableTable>
    </>
  );
}

export default FavouriteETATable;

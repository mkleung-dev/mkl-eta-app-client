import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap';
import { useParams } from 'react-router';
import SortableTable from './SortableTable';
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

  function getDisplayData() {
    let temp = [];
    let postfix = [];
    if (busRouteData.response) {
      for (let i = 0; i < busRouteData.response.data.length; i++) {
        let stop = busRouteData.response.data[i];

        let data0 = stop.name_tc;
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
          

        if (!isFavourite(stop)) {
          postfix4 = <Button onClick={() => addToFavourites(stop)}>＋</Button>;
        } else {
          postfix4 =  <Button onClick={() => removeFromFavourites(stop)}>－</Button>;
        }
        
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
      { content: "巴士站", align: "center", width: "30%", },
      { content: "下一班", align: "center", width: "30%", },
      { content: "最愛", align: "center", width: "20%", },
    ],
  };
  let filter = {
    col: [
      { text: "", type: "", clear: false},
      { text: "", type: "", clear: false},
      { text: "", type: "", clear: false},
    ],
  };
  let sort = {
    col: [
      { type: "" },
      { type: "" },
      { type: "" },
    ],
    colIndex: 0,
    asc: true,
  };
  if (width > 1024) {
    config = {
      col: [
        { content: "巴士站", align: "center", width: "20%", },
        { content: "下一班", align: "center", width: "20%", },
        { content: "第二班", align: "center", width: "20%", },
        { content: "第三班", align: "center", width: "20%", },
        { content: "最愛", align: "center", width: "10%", },
      ],
    };
    filter = {
      col: [
        { text: "", type: "", clear: false},
        { text: "", type: "", clear: false},
        { text: "", type: "", clear: false},
        { text: "", type: "", clear: false},
        { text: "", type: "", clear: false},
      ],
    };
    sort = {
      col: [
        { type: "" },
        { type: "" },
        { type: "" },
        { type: "" },
        { type: "" },
      ],
      colIndex: 0,
      asc: true,
    };
  }

  return (
    <>
      <h1>九巴路線　{route}</h1>
      <SortableTable config={config} data={data} filter={filter}></SortableTable>
    </>
  );
}

export default KmbRouteETATable;

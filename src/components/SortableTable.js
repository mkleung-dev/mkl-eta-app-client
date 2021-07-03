import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Form, Row, Col } from 'react-bootstrap';

import './SortableTable.css';

export const SortableTable = (props) => {
  const [ filterState , setFilterState] = useState({text: Array(props.config.col.length).fill('')});
  let initialSortState = {
    colIndex: 0,
    asc: true,
  };
  if (props.sort) {
    initialSortState = {
      colIndex: props.sort.colIndex,
      asc: props.sort.asc,
    };
  }
  const [ sortState , setSortState] = useState(initialSortState);

  useEffect(() => {
    if (sortState.colIndex !== initialSortState.colIndex || sortState.asc !== initialSortState.asc) {
      setSortState({
        colIndex: initialSortState.colIndex, 
        asc: initialSortState.asc,
      })
    }
  }, [initialSortState.colIndex, initialSortState.asc]);

  const sortBy = (event, data, colIndex) => {
    if (sortState.colIndex === colIndex) {
      setSortState({
        ...sortState,
        asc: !sortState.asc,
      });
    } else {
      let asc = true;
      if (props.sort.col[colIndex].type.search('number') >= 0) {
        asc = false;
      }
      setSortState({
        ...sortState,
        colIndex: colIndex,
        asc: asc,
      });
    }
  };

  const setFilter = (colIndex, data) => {
    let backupText = filterState.text;
    backupText[colIndex] = data;
    setFilterState({
      ...filterState,
      text: backupText,
    });
  }

  const handleFilter = (event, data, colIndex) => {
    setFilter(colIndex, event.target.value);
  };

  const clearFilter = (event, data, colIndex) => {
    setFilter(colIndex, '');
  };

  const selectFilter = (event, data, colIndex, text) => {
    setFilter(colIndex, text + '');
  }


  const getDisplayData = () => {
    let displayData = [];

    if (props.data) {
      for (let i = 0; i < props.data.data.length; i++) {
        let prefixData = props.data.prefix?props.data.prefix[i]:null;
        let data = props.data.data[i]
        let postfixData = props.data.postfix?props.data.postfix[i]:null;
        let positiveData = props.data.positive?props.data.positive[i]:null;
        let keyData = props.data.key?props.data.key[i]:null;
        let included = true;

        for (let j = 0; included && j < filterState.text.length; j++) {
          if (filterState.text[j].length > 0) {
            if (props.filter.col[j].type === 'key_absolute_larger') {
              if (Math.abs(parseFloat(filterState.text[j])) > 0) {
                included = false;
                if (Math.abs(keyData[j]) >= Math.abs(parseFloat(filterState.text[j]))) {
                  included = true;
                }
              }
            } else if (props.filter.col[j].type === 'key_match') {
              if (Math.abs(parseFloat(filterState.text[j])) > 0) {
                included = false;
                if (Math.abs(keyData[j]) >= Math.abs(parseFloat(filterState.text[j]))) {
                  included = true;
                }
              }
            } else if (props.filter.col[j].type === 'absolute_larger') {
              if (Math.abs(parseFloat(filterState.text[j])) > 0) {
                included = false;
                if (Math.abs(data[j]) >= Math.abs(parseFloat(filterState.text[j]))) {
                  included = true;
                }
              }
            } else { // 'match'
              included = false;
              if (data[j].indexOf(filterState.text[j]) >= 0) {
                included = true;
              }
            }
          }
        }
        if (included) {
          displayData.push({
            prefix: prefixData,
            data: data,
            key: keyData,
            postfix: postfixData,
            positive: positiveData,
          });
        }
      }
    } else {
      return null;
    }

    if (props.sort) {
      if (sortState.colIndex >= 0 && sortState.colIndex < props.sort.col.length) {
        displayData.sort((a, b) => {
          if (props.sort.col[sortState.colIndex].type.search('key_absolute_number') >= 0) {
            return Math.abs(b.key[sortState.colIndex]) - Math.abs(a.key[sortState.colIndex]);
          } else if (props.sort.col[sortState.colIndex].type.search('key_number') >= 0) {
            return b.key[sortState.colIndex] - a.key[sortState.colIndex];
          } else if (props.sort.col[sortState.colIndex].type.search('key_string') >= 0) {
            return b.key[sortState.colIndex].localeCompare(a.key[sortState.colIndex])
          } else if (props.sort.col[sortState.colIndex].type.search('absolute_number') >= 0) {
            return Math.abs(b.data[sortState.colIndex]) - Math.abs(a.data[sortState.colIndex]);
          } else if (props.sort.col[sortState.colIndex].type.search('number') >= 0) {
            return b.data[sortState.colIndex] - a.data[sortState.colIndex];
          } else {
            return b.data[sortState.colIndex].localeCompare(a.data[sortState.colIndex])
          }
        })
        if (sortState.asc) {
          displayData.reverse();
        }
      }
    }

    return displayData;
  };

  let sortActive = Array(props.config.col.ength).fill(false);
  let sortIcon = Array(props.config.col.length).fill('bi-sort-alpha-down');

  if (props.sort) {
    sortActive[sortState.colIndex] = true;
    for (let i = 0; i < sortIcon.length; i++) {
      if (props.sort.col[i].type.search('number') >= 0) {
        sortIcon[i] = sortIcon[i].replace('alpha', 'numeric');
      }
      if (sortState.colIndex === i) {
        if ((props.sort.col[i].type.search('number') >= 0 && sortState.asc) ||
            (props.sort.col[i].type.search('number') < 0 && !sortState.asc)) {
          sortIcon[i] = sortIcon[i] + "-alt";
        }
      }
    }
  }

  let displayData = getDisplayData();

  return(
    <>
    <Table responsive="sm">
      {props.config && 
        <thead>
          <tr>
            {props.config.col.map((element, colIndex) => (
              <th width={element.width}>
              {
                (props.sort && props.sort.col[colIndex].type.length > 0 &&
                  (
                    <Button
                      block
                      variant={sortActive[colIndex]?"success":"primary"}
                      onClick={(event, data) => sortBy(event, data, colIndex)}
                      >
                      <i class={sortIcon[colIndex]}></i>
                      {element.content}
                    </Button>
                  )
                )
              }
              {
                ((!props.sort || props.sort.col[colIndex].type.length === 0) &&
                  (
                    <Button
                      disabled
                      block
                      variant="dark"
                      >
                      {element.content}
                    </Button>
                  )
                )
              }
                
              </th>
            ))}
          </tr>
        </thead>
      }
      {props.filter && 
        <thead>
          <tr>
            {props.filter.col.map((element, colIndex) => (
              <th>
                { (props.filter.col[colIndex].type.length > 0) &&
                  (
                    <Form>
                      <Row noGutters>
                        <Col>
                          <Form.Control
                            type="text" 
                            placeholder={element.text} 
                            onChange={(event, data) => handleFilter(event, data, colIndex)} 
                            value={filterState.text[colIndex]}/>
                        </Col>
                        { props.filter.col[colIndex].clear &&
                          (
                            <Col md="auto">
                              <Button
                                variant="light"
                                onClick={(event, data) => clearFilter(event, data, colIndex)}
                                >
                                <i class="bi-x-circle"></i>
                              </Button>
                            </Col>
                          )
                        }
                      </Row>
                    </Form>
                  )
                }
              </th>
            ))}
          </tr>
        </thead>
      }
      <tbody>
        {!displayData &&
          <tr>
            <td colspan={props.config.col.length} textAlign='center'>
              <Spinner></Spinner>
            </td>
          </tr>
        }
        {displayData && displayData.map((row, rowIndex) => (
          <>
            <tr>
              {row.data.map((element, colIndex) => ( 
                <td className={(props.filter && props.filter.col && props.filter.col[colIndex] && props.filter.col[colIndex].type.length > 0) ? "content_cell":""}
                  align={props.config.col[colIndex].align}
                  onClick={(props.filter && props.filter.col && props.filter.col[colIndex] && props.filter.col[colIndex].type.length > 0) ? ((event, data) => selectFilter(event, data, colIndex, element)) : ((event, data) => {})}
                  positive={row.positive && row.positive[colIndex] && row.positive[colIndex] > 0}
                  negative={row.positive && row.positive[colIndex] && row.positive[colIndex] < 0}>
                    {row.prefix && row.prefix[colIndex]}
                    {props.config.col[colIndex].prefix}
                    {element}
                    {props.config.col[colIndex].postfix}
                    {row.postfix && row.postfix[colIndex]}
                </td> 
              ))}
            </tr>
          </>
        ))}
      </tbody>
    </Table>
    </>
  );
};

export default SortableTable;
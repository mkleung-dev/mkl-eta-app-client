import React from 'react'
import './App.css';
import { Container, Nav, Navbar, NavItem } from "react-bootstrap";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import KmbRouteETATable from './components/KmbRouteETATable';
import AllKmbRouteTable from './components/AllKmbRouteTable';
import AllKmbStopTable from './components/AllKmbStopTable';


function App() {
  return (
    <div className="App container">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="/">交通工具到達時間</Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Link href="/all_kmb_route">所有九巴路線</Nav.Link>
          {/*<Nav.Link href="/all_bus_stop">All Bus Stop</Nav.Link>*/}
        </Nav>
      </Navbar>
      <Router>
        <Switch>
          <Route exact path="/">
            <Redirect to="/all_kmb_route"></Redirect>
          </Route>
          <Route exact path="/bus_route/:route/:bound/:service_type">
            <Container>
              <KmbRouteETATable></KmbRouteETATable>
            </Container>
          </Route>
          <Route exact path="/all_kmb_route">
            <Container>
              <AllKmbRouteTable></AllKmbRouteTable>
            </Container>
          </Route>
          <Route exact path="/all_bus_stop">
            <Container>
              <AllKmbStopTable></AllKmbStopTable>
            </Container>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}


export default App;

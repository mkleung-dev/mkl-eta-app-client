import React from 'react'
import './App.css';
import { Container, Nav, Navbar, NavItem } from "react-bootstrap";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import AllBusRouteTable from './components/AllBusRouteTable';
import BusRouteTable from './components/BusRouteTable';
import AllBusStopTable from './components/AllBusStopTable';
import BusRouteETATable from './components/BusRouteETATable'


function App() {
  return (
    <div className="App container">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="/">Kmb Bus</Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Link href="/all_bus_route">All Bus Route</Nav.Link>
          <Nav.Link href="/all_bus_stop">All Bus Stop</Nav.Link>
        </Nav>
      </Navbar>
      <Router>
        <Switch>
          <Route path="/bus_route/:route/:bound/:service_type">
            <Container>
              <BusRouteTable></BusRouteTable>
            </Container>
          </Route>
          <Route path="/bus_route_eta/:route/:service_type">
            <Container>
              <BusRouteETATable></BusRouteETATable>
            </Container>
          </Route>
          <Route exact path="/all_bus_route">
            <Container>
              <AllBusRouteTable></AllBusRouteTable>
            </Container>
          </Route>
          <Route exact path="/all_bus_stop">
            <Container>
              <AllBusStopTable></AllBusStopTable>
            </Container>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}


export default App;

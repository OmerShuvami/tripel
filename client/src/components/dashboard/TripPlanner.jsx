import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { GeneralContext } from "../../context/GeneralContext";
import { FaTrash } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import {
  CreateDateFromMinMax,
  createItem,
  getItemsWithFilter,
  updateItem,
  deleteItem,
} from "../../utils/CRUDService";
import Modal from "react-modal";
import { CurrentContext } from "../../context/CurrentContext";
import { MdEdit } from "react-icons/md";
import "./dashboard.css";

import { format, addDays, min, max, isAfter, isEqual } from "date-fns";
import { GrNext } from "react-icons/gr";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    padding: "2rem 1.5rem",
    borderRadius: "0.5rem",
  },
};

function TripPlanner() {
  const {
    user,
    setUser,
    areas,
    setAreas,
    isLoading,
    setIsLoading,
    setGoBack,
    flights,
    setFlights,
  } = useContext(GeneralContext);
  const {
    currentTrip,
    setCurrentTrip,
    currentArea,
    setCurrentArea,
    setCurrentFlight,
  } = useContext(CurrentContext);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 1));
  const [allShownDays, setAllShownDays] = useState([]);
  const [allShownAreasAndFlights, setAllShownAreasAndFlights] = useState([
    { areaName: "" },
  ]);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [test, setTest] = useState(false);
  const [showenFlights, setShowenFlights] = useState([]);
  const [areaIndex, setAreaIndex] = useState(-1);
  const [realArea, setRealArea] = useState("");
  const navigate = useNavigate();

  const orderShown = () => {
    const tempAllShownArr = areas.concat(showenFlights);
    const arr2 = tempAllShownArr?.map(
      (v) =>
        (v = {
          ...v,
          minDate: min(v?.Days?.map((d) => d?.day)),
          maxDay: max(v?.Days?.map((d) => d?.day)),
        })
    );
    const arr3 = arr2.sort((a, b) =>
      (
        isEqual(a.minDate, b.minDate)
          ? isAfter(a.maxDate, b.maxDate)
            ? true
            : false
          : isAfter(a.minDate, b.minDate)
      )
        ? 1
        : -1
    );
    setAllShownAreasAndFlights(arr3);
  };

  useEffect(() => {
    if (user.id) {
      setGoBack("/dashboard");
    }
  }, [user.id]);

  function openModal(index) {
    setAreaIndex(index);
    setIsOpen(true);
  }
  function closeModal() {
    setAllShownDays([]);
    setAreaIndex(-1);
    setIsOpen(false);
  }

  const handleChooseFlight = (info) => {
    if (info) {
      console.log(info);
      setCurrentFlight(info);
      navigate("flightShowCase");
    } else {
      navigate("flights");
    }
  };

  const handleAreaChange = (event) => {
    setRealArea(event.target.value);
  };

  const handleAreaSubmit = () => {
    // if (areas[areaIndex]?.id && areas[areaIndex].id === currentArea.id) {
    //   updateItem("area", currentArea.id, areas[areaIndex])
    //     .then((response) => {
    //       CreateDateFromMinMax(startDate, endDate, currentTrip.id, {
    //         areaId: currentArea.id,
    //       })
    //         .then(() => orderShown())
    //         .catch((err) => console.error(err));
    //       setCurrentArea(response.data);
    //       closeModal();
    //     })
    //     .catch((err) => console.log(err));
    // } else {
    createItem("area", currentTrip.id, { areaName: realArea })
      .then((response) => {
        console.log(startDate, endDate, response.data.area.id);
        CreateDateFromMinMax(startDate, endDate, currentTrip.id, {
          areaId: response.data.area.id,
        }).then(() => {
          window.location.reload();
        });
        closeModal();
      })
      .catch((err) => console.log(err));
  };

  const handleChooseArea = (location) => {
    const tempArea = location;
    setCurrentArea(tempArea);
    navigate("area/overview");
  };

  const handlePayment = () => {
    navigate("payment");
  };

  const handleAddLocation = (index) => {
    const newAreas = [...allShownAreasAndFlights];
    newAreas.splice(index + 1, 0, { areaName: "" });
    setAllShownAreasAndFlights(newAreas);
  };
  const handleRemoveLocation = (index, id, nextItem) => {
    const newAreas = [...allShownAreasAndFlights];
    newAreas.splice(index, 1);
    setAllShownAreasAndFlights(newAreas);
    deleteItem("area", id);
    if (nextItem?.flightName) {
      deleteItem("flight", nextItem.id);
    }
  };

  useEffect(() => {
    getItemsWithFilter("trip", { id: currentTrip.id })
      .then((response) => {
        if (localStorage.getItem("currentTrip") == response.data[0].id) {
          if (response.data[0].Areas.length > 0) {
            setAreas(response.data[0].Areas);
          } else {
            // setAreas([{ areaName: "" }]);
          }
          if (response.data[0].Flights.length > 0) {
            setShowenFlights(response.data[0].Flights);
          }

          if (areas[0].tripId === currentTrip.id) {
            orderShown();
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  }, [currentTrip, currentArea]);

  const handleAreaEdit = (event, index) => {
    event.stopPropagation();
    setCurrentArea(areas[index]);
    openModal(index);
  };
  const handleAreaAdd = (index) => {
    // setCurrentArea(areas[index]);
    openModal(index);
  };

  const handleStartDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    setStartDate(selectedDate);
    if (selectedDate > endDate) {
      setEndDate(addDays(selectedDate, 1));
    }
  };

  const handleEndDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    setEndDate(selectedDate);
  };

  useEffect(() => {
    if (currentArea.id) {
      getItemsWithFilter("area", { Id: currentArea.id })
        .then((response) => {
          setAllShownDays(response.data[0].Days);
        })
        .catch((err) => console.error(err));
    }
  }, [currentArea]);

  const getFirstDay = () => {
    if (allShownDays.length > 0) {
      return format(allShownDays[0]?.day, "yyyy-MM-dd");
    } else {
      return format(new Date(), "yyyy-MM-dd");
    }
  };
  const getLastDay = () => {
    if (allShownDays.length > 0) {
      return format(allShownDays[allShownDays.length - 1]?.day, "yyyy-MM-dd");
    } else {
      return format(addDays(new Date(), 1), "yyyy-MM-dd");
    }
  };

  return (
    <div>
      <div className="cards-container-center">
        <div className="flight-location-container">
          {allShownAreasAndFlights[0]?.flightName ? (
            <div
              className="filled-card small-card"
              onClick={() => handleChooseFlight(allShownAreasAndFlights[0])}
              style={{marginLeft:"0.5rem"}}
            >
              <div className="flight-preview">
                <img
                  src={
                    JSON.parse(allShownAreasAndFlights[0].flightInfo).flights[0]
                      .airline_logo
                  }
                  alt=""
                  className="flight-company-img"
                />
                <span>
                  {
                    JSON.parse(allShownAreasAndFlights[0].flightInfo).flights[0]
                      .departure_airport.id
                  }
                </span>
                <GrNext />
                <span>
                  {
                    JSON.parse(allShownAreasAndFlights[0].flightInfo).flights[
                      JSON.parse(allShownAreasAndFlights[0].flightInfo).flights
                        .length - 1
                    ].arrival_airport.id
                  }{" "}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="filled-card small-card"
              onClick={() => handleChooseFlight(false)}
            >
              <p> Add Flight To...</p>
            </div>
          )}
          {allShownAreasAndFlights.length > 0 &&
            allShownAreasAndFlights.map(
              (location, index) =>
                (location?.areaName || location?.areaName == "") && (
                  <div key={index} className="flight-location-container" >
                    {allShownAreasAndFlights[index].areaName == "" ? (
                      <div
                        className="filled-card"
                        onClick={() => handleAreaAdd(index)}
                      >
                        <h2>Enter Location</h2>{" "}
                      </div>
                    ) : (
                      <div
                        className="filled-card"
                        onClick={() => handleChooseArea(location)}
                      >
                        <h2>{location.areaName}</h2>
                        <button
                          className="outlined-button edit icon"
                          onClick={(event) => handleAreaEdit(event, index)}
                        >
                          <MdEdit />
                        </button>
                      </div>
                    )}
                    <Modal
                      isOpen={modalIsOpen}
                      onRequestClose={closeModal}
                      style={customStyles}
                      contentLabel="Choose Area Modal"
                      appElement={document.getElementById("root")}
                      index={index}
                    >
                      <input
                        type="text"
                        placeholder="Enter Location..."
                        defaultValue={currentArea.areaName || ""}
                        onChange={(event) => handleAreaChange(event)}
                      />
                      <div className="date-inputs">
                        <label htmlFor="start-date">
                          Start Date
                          <input
                            type="date"
                            id="start-date"
                            defaultValue={getFirstDay()}
                            min={format(new Date(), "yyyy-MM-dd")}
                            onChange={handleStartDateChange}
                          />
                        </label>

                        <label htmlFor="end-date">
                          End Date
                          <input
                            type="date"
                            id="end-date"
                            defaultValue={getLastDay()}
                            min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                            onChange={handleEndDateChange}
                          />
                        </label>
                      </div>
                      <div className="modal-buttons">
                        <button
                          onClick={closeModal}
                          className="outlined-button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAreaSubmit}
                          className="primary-button"
                        >
                          Submit
                        </button>
                      </div>
                    </Modal>
                    <div className="flight-location">
                      {/* <button onClick={() => console.log((JSON.parse(allShownAreasAndFlights[index + 1].flightInfo).flights).length-1)}>tst</button> */}
                      {allShownAreasAndFlights[index + 1]?.flightName ? (
                        <div
                          className="filled-card small-card"
                          onClick={() =>
                            handleChooseFlight(
                              allShownAreasAndFlights[index + 1]
                            )
                          }
                        >
                          <div className="flight-preview">
                            <img
                              src={
                                JSON.parse(
                                  allShownAreasAndFlights[index + 1].flightInfo
                                ).flights[0].airline_logo
                              }
                              alt=""
                              className="flight-company-img"
                            />
                            <span>
                              {
                                JSON.parse(
                                  allShownAreasAndFlights[index + 1].flightInfo
                                ).flights[0].departure_airport.id
                              }
                            </span>
                            <GrNext />
                            <span>
                              {
                                JSON.parse(
                                  allShownAreasAndFlights[index + 1].flightInfo
                                ).flights[
                                  JSON.parse(
                                    allShownAreasAndFlights[index + 1]
                                      .flightInfo
                                  ).flights.length - 1
                                ].arrival_airport.id
                              }{" "}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="filled-card small-card"
                          onClick={() => handleChooseFlight(false)}
                        >
                          <p> Add Flight To...</p>
                        </div>
                      )}
                      <button
                        className="primary-button icon small-card"
                        onClick={() => handleAddLocation(index)}
                      >
                        <FaPlus />
                      </button>
                      {index > 0 && (
                        <button
                          className="delete-button icon small-card"
                          onClick={() =>
                            handleRemoveLocation(index, location.id)
                          }
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                )
            )}
        </div>
      </div>
      {/* <button className="primary-button" onClick={handlePayment}>
        Payment
      </button> */}
    </div>
  );
}

export default TripPlanner;

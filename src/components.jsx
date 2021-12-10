import React from 'react'
import { connect } from 'react-redux'

import { fetchAddresses, fetchEvents, fetchSelectedEventDetails } from './thunks'
import { eventGuid, canSelectEvents, undeletedAddresses} from './selectors'
import { actions } from './redux-store'


//--> User select form
const submitHandler = (dispatch, userId) => (e) => {
  e.preventDefault()

  dispatch({
    type: actions.CHANGE_SELECTED_USER_ID,
    payload: userId
  })
}

const changeHandler = (dispatch) => (e) => {
  const val = e.target.value

  dispatch({
    type: actions.CHANGE_SELECTED_USER_ID,
    payload: val
  })
  dispatch(fetchAddresses(val))
}

let UserSelectForm = ({ dispatch, userIds, selectedUserId }) => {
  return <form action="{API_BASE}/users/{selectedUserId}/addresses" method="GET" onSubmit={submitHandler(dispatch, selectedUserId)}>
    <select onChange={changeHandler(dispatch)} value={selectedUserId || ''}>
      <option>Select User ID</option>
      {userIds.map((id) => {
        return <option key={id} value={id}>{id}</option>
      })}
    </select>
  </form>
}
UserSelectForm = connect(state => state)(UserSelectForm)


//--> Events list
const handleEventToggle = (dispatch, guid) => (e) => {
  dispatch({
    type: actions.TOGGLE_EVENT_SELECTION,
    payload: guid
  })
}
let Event = ({ dispatch, event, guid, isSelected, isEnabled }) => {
  return <li>
    <input id={guid} type="checkbox" checked={isSelected} disabled={!isEnabled} onChange={handleEventToggle(dispatch, guid)} />
    <label htmlFor={guid}>
      {event.type} | {event.created_at}
    </label>
  </li>
}
Event = connect((state, ownProps) => {
  const isSelected = !!state.selectedEvents[ownProps.guid]
  return {
    isSelected : isSelected,
    isEnabled : isSelected || canSelectEvents(state.selectedEvents)
  }
})(Event)


const handleCompareClick = (dispatch, comparisonJson) => (e) => {
  /*
   * Your code here (and probably elsewhere)
   *
   *
   * We've provided a thunk function to fetch
   * event data.
   * Find it in thunks.js, lines 81-107,
   * and referenced in the comment below on line 78.
   */

  dispatch({
    type: actions.COMPARE_SELECTED_EVENTS,
    payload: comparisonJson
  })

  dispatch(fetchSelectedEventDetails())
}


let EventList = ({dispatch, canCompare, events}) => {
  return <>
    <button onClick={handleCompareClick(dispatch)} disabled={!canCompare}>Compare</button>
    <ul>
      {events.map((event) => {
        return <Event event={event} key={eventGuid(event)} guid={eventGuid(event)} />
      })}
    </ul>
  </>
}
EventList = connect(state => {
  return { canCompare : Object.keys(state.selectedEvents).length > 1 }
})(EventList)



//--> Addresses list
const handleAddressClick = (dispatch, id) => (e) => {
  e.preventDefault()

  dispatch({
    type: actions.REQUEST_ADDRESS_DETAILS,
    payload: id
  })
  dispatch(fetchEvents(id))
}

let Address = ({ dispatch, addressJson, isSelected }) => {
  return <li onClick={handleAddressClick(dispatch, addressJson.id)} className={isSelected ? 'selected' : ''}>
    <pre>{JSON.stringify(addressJson, undefined, 2)}</pre>
  </li>
}
Address = connect((state, ownProps) => {
  return { isSelected : state.selectedAddressId === ownProps.addressJson.id }
})(Address)


let Modal = (props) => {

  if(props.comparisonJson){
    const [A,B] = [...props.comparisonJson]
    // TODO: Remove these console.logs
    // console.log("A: " + A.id)
    // console.log("B: " + B.id)

    // TODO: This is a car wreck. Next step would be to extract these event 
    // details out into their own compoents and feed them the correct props.
    // Also, need to handle unique keys for each list element. What I have 
    // currently is not working.
    return <div className="modal">
    <ul className="event_A">
      {Object.keys(A).map( (key) => {
      return(
      <div>  
        {A[key]===B[key]
        ? <li key={key + "_A"}>{key}: {A[key]}</li>
        : <li key={key + "_A"} className="diff">{key}: {A[key]}</li>
        }
      </div>)
      })}
    </ul>
    <ul className="event_B">      
      {Object.keys(B).map( (key) => {
      return(
      <div>
        {A[key]===B[key]
        ? <li key={key + "_B"}>{key}: {B[key]}</li>
        : <li key={key + "_B"} className="diff">{key}: {B[key]}</li>
      }
      </div>)
      })}
    </ul>
    </div>
  }

  return <>
    <p>We're in the Modal.</p>
  </>
}
Modal = connect( (state) => {return {comparisonJson: state.comparisonJson} } )(Modal)


//--> App wrapper
let App = ({ addresses, events, userIds, selectedUserId, selectedAddressId, comparingEvents, comparisonJson, error} ) => {
  return <>
    {error ? <p className="error">{error}</p> : ''}
    {userIds && userIds.length ?
      <UserSelectForm userIds={userIds} selectedUserId={selectedUserId} />
    : ''}
    <div className="addresses">
      <h2>Address Information</h2>
      {addresses && addresses.length
        ? <ul>
            {addresses.map((address) => {
              return <Address key={address.id} addressJson={address} />
            })}
          </ul>
        : <p>{selectedUserId ? 'No addresses found.' : 'Choose a user ID from the dropdown above.'}</p>
      }
    </div>
    <div className="events">
      <h2>Events</h2>
      { events && events.length
        ? <EventList events={events} />
        : <p>{selectedAddressId ? 'No events found.' : 'Select an address to see events'}</p>
      }
    </div>

    <div className="comparison">
      { comparingEvents 
      ?  <>
          <h2>Comparison</h2>
          {/* TODO: Enable the ability to close the modal. */}
          <button >Close me. (not enabled yet)</button>
          <Modal  comparisonJson={comparisonJson}/>
        </>
      : <p>To compare events, choose two and click the compare button.</p>
      }
    </div>
  </>
}
App = connect(state => {
  return {
    addresses : undeletedAddresses(state.addresses),
    ...state
  }
})(App)


export { App }

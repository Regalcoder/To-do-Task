const inputBox = document.getElementById("input-box"); // target input box element id
const listContainer = document.getElementById("list-container");  // targeting the ul element id

function addTask(){
    if(inputBox.value === ''){
        alert("you must write something"); // condition to ensure that user enters inputs
    }
    else { // condition to recieve user input and update it on the DOM
        let li = document.createElement('li'); // this method will create a new element on the DOM, in this case list element
        li.innerHTML = inputBox.value; // this method will capture the user entry and set it to the created li element using the innerhtml method
        listContainer.appendChild(li); //this method will append the newly created and updated list element on the DOM.
        let span = document.createElement("span"); // we use the create method to create a span element on the dom
        span.innerHTML = "\u00d7"; //using the inner html we set the span element to contain the code which is code for X icon
        li.appendChild(span); // we then append or fix the created span to appear on the same line with the list element on the dom
    }
    inputBox.value = "";
    saveData(); // we invoke the save data function here so that anytime an item is added it is saved to local storage
        
} 


// function to implement delete and task check functionalities
listContainer.addEventListener("click", function(e){   // event listener calls function when the listContainer class is clicked
    if (e.target.tagName === "LI"){ // if list element is clicked, the condition in the parentesis is carried out
        e.target.classList.toggle('checked'); // this method toggles the 'checked' class in the css which is an image
        saveData(); //we invoke the function so that the local storage is upate when a task checked or unchecked 
    }
    else if(e.target.tagName === "SPAN"){ // if user clicks span element then...
        e.target.parentElement.remove(); //the remove method is called and removes the whole element from the dom
        saveData(); // we update local storage when user deletes entry
    }
}, false);

// function that saves all data in the listcontainer elemnet to local storage
function saveData(){
    localStorage.setItem("data", listContainer.innerHTML);
}

//function that displays all data entries when browser is reloaded or closed and opened again
function showTask(){
    listContainer.innerHTML = localStorage.getItem("data"); //the getitem method gets all data stored on the browser storage
}

showTask(); // we invoke the local storage get function so that data is dipslayed directly from local storage at all times
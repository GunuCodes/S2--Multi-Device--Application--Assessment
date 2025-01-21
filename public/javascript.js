// Base API URL depending on environment.
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : '/api';

// Check if user is authenticated.
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    
    // Update UI with user info if available.
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const profileNameElement = document.querySelector('.profile-name');
            if (user && user.username && profileNameElement) {
                profileNameElement.textContent = user.username;
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            return false;
        }
    } else {
        // Fetch user data from server if not in local storage.
        fetch(`${API_URL}/users/profile`, {
            headers: {
                'x-auth-token': token
            }
        })
        .then(response => response.json())
        .then(user => {
            if (user && user.username) {
                localStorage.setItem('user', JSON.stringify(user));
                const profileNameElement = document.querySelector('.profile-name');
                if (profileNameElement) {
                    profileNameElement.textContent = user.username;
                }
            }
        })
        .catch(error => {
            console.error('Failed to fetch user profile:', error);
        });
    }
    return true;
}

// Log out the user.
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Make API calls with authentication headers.
async function makeAPICall(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-auth-token': token,
                ...options.headers
            },
            mode: 'cors',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        
        return response;
    } catch (error) {
        console.error('API call failed:', error);
        if (error.message === 'Unauthorized') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
        throw error;
    }
}

// Fetch events from the server.
async function fetchEvents() {
    try {
        const response = await makeAPICall(`${API_URL}/events`);
        const events = await response.json();
        return events;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        throw error;
    }
}

// Create a new event on the server.
async function createEvent(eventData) {
    try {
        const response = await makeAPICall(`${API_URL}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
        const savedEvent = await response.json();
        return {
            ...savedEvent,
            startDate: savedEvent.startDate.split('T')[0],
            endDate: savedEvent.endDate.split('T')[0]
        };
    } catch (error) {
        console.error('Failed to create event:', error);
        throw error;
    }
}

// Update an existing event on the server.
async function updateEvent(eventId, eventData) {
    try {
        const response = await makeAPICall(`${API_URL}/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
        const updatedEvent = await response.json();
        return {
            ...updatedEvent,
            startDate: updatedEvent.startDate.split('T')[0],
            endDate: updatedEvent.endDate.split('T')[0]
        };
    } catch (error) {
        console.error('Failed to update event:', error);
        throw error;
    }
}

// Delete an event from the server.
async function deleteEvent(eventId) {
    try {
        const response = await makeAPICall(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to delete event:', error);
        throw error;
    }
}

// Create date select dropdowns for event form.
function createDateSelects(containerId, defaultDate = new Date()) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Create month select dropdown.
    const monthSelect = document.createElement('select');
    const months = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        if (index === defaultDate.getMonth()) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });
    
    // Create day select dropdown.
    const daySelect = document.createElement('select');
    const daysInMonth = new Date(defaultDate.getFullYear(), defaultDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === defaultDate.getDate()) {
            option.selected = true;
        }
        daySelect.appendChild(option);
    }
    
    // Create year select dropdown.
    const yearSelect = document.createElement('select');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 1; i <= currentYear + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === defaultDate.getFullYear()) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Update days when month/year changes.
    function updateDays() {
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        const currentDay = parseInt(daySelect.value);
        const daysInNewMonth = new Date(year, month + 1, 0).getDate();
        
        daySelect.innerHTML = '';
        for (let i = 1; i <= daysInNewMonth; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentDay && i <= daysInNewMonth) {
                option.selected = true;
            } else if (currentDay > daysInNewMonth && i === daysInNewMonth) {
                option.selected = true;
            }
            daySelect.appendChild(option);
        }
    }
    
    monthSelect.addEventListener('change', updateDays);
    yearSelect.addEventListener('change', updateDays);
    
    container.appendChild(monthSelect);
    container.appendChild(daySelect);
    container.appendChild(yearSelect);
}

// Initialize the application when the page loads.
document.addEventListener('DOMContentLoaded', async function() {
    try {
        if (!checkAuth()) {
            return;
        }
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        let currentDate = new Date();
        let selectedDate = new Date(currentDate);
        let currentEventId = null;
        
        window.events = [];
        
        // Fetch and initialize events from server.
        try {
            const fetchedEvents = await fetchEvents();
            window.events = Array.isArray(fetchedEvents) ? fetchedEvents.map(event => ({
                ...event,
                startDate: event.startDate.split('T')[0],
                endDate: event.endDate.split('T')[0]
            })) : [];
        } catch (error) {
            window.events = [];
        }

        const eventForm = document.querySelector('.event-form');
        const addEventBtn = document.querySelector('.js-event__add');

        const calendarBody = document.querySelector('.calendar__body');
        const currentMonthElement = document.querySelector('.current-month');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');

        if (!calendarBody || !currentMonthElement || !prevMonthBtn || !nextMonthBtn) {
            return;
        }

        // Navigate through months.
        function navigateMonth(direction) {
            const newMonth = new Date(currentDate);
            if (direction === 'prev') {
                newMonth.setMonth(currentDate.getMonth() - 1);
            } else {
                newMonth.setMonth(currentDate.getMonth() + 1);
            }
            currentDate = newMonth;
            selectedDate = new Date(currentDate);
            renderCalendar();
            updateSidebar(selectedDate);
        }

        // Add event listeners for navigation buttons.
        prevMonthBtn.addEventListener('click', () => navigateMonth('prev'));
        nextMonthBtn.addEventListener('click', () => navigateMonth('next'));

        // Initial render of the calendar.
        renderCalendar();
        updateSidebar(selectedDate);

        // Add keyboard navigation for months.
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                navigateMonth('prev');
            } else if (e.key === 'ArrowRight') {
                navigateMonth('next');
            }
        });

        // Render the calendar with events.
        function renderCalendar() {
            const calendarBody = document.querySelector('.calendar__body');
            const currentMonthElement = document.querySelector('.current-month');
            
            currentMonthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            calendarBody.innerHTML = '';

            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            
            let firstDayOfWeek = firstDay.getDay();
            if (firstDayOfWeek === 0) firstDayOfWeek = 7;

            const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
            
            // Create weeks container.
            const weeksContainer = document.createElement('div');
            weeksContainer.className = 'calendar__weeks';
            
            // Create 5 weeks.
            for (let i = 0; i < 5; i++) {
                const week = document.createElement('div');
                week.className = 'calendar__week';
                week.style.gridTemplateColumns = 'repeat(7, 1fr)';
                week.style.position = 'relative';

                for (let j = 1; j <= 7; j++) {
                    const dayDiv = document.createElement('div');
                    dayDiv.className = 'calendar__day';
                    
                    const dayNumber = i * 7 + j - firstDayOfWeek + 1;
                    const isCurrentMonth = dayNumber > 0 && dayNumber <= lastDay.getDate();
                    
                    if (!isCurrentMonth) {
                        if (dayNumber <= 0) {
                            dayDiv.textContent = prevMonthDays + dayNumber;
                            dayDiv.classList.add('day--disabled');
                        } else {
                            dayDiv.textContent = dayNumber - lastDay.getDate();
                            dayDiv.classList.add('day--disabled');
                        }
                    } else {
                        dayDiv.textContent = dayNumber;
                        const dateForDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber + 1);
                        dayDiv.dataset.date = dateForDay.toISOString().split('T')[0];
                        dayDiv.dataset.weekIndex = i;
                        dayDiv.dataset.dayIndex = j + 1;

                        // Highlight today's date.
                        const today = new Date();
                        if (dayNumber === today.getDate() && 
                            currentDate.getMonth() === today.getMonth() && 
                            currentDate.getFullYear() === today.getFullYear()) {
                            dayDiv.classList.add('calendar__day--today');
                        }
                    }
                    week.appendChild(dayDiv);
                }
                weeksContainer.appendChild(week);
            }
            calendarBody.appendChild(weeksContainer);

            // Add events to the calendar.
            window.events.forEach(event => {
                const startDate = new Date(event.startDate);
                const endDate = new Date(event.endDate);
                
                // Find the week and position for the event.
                const startDayEl = document.querySelector(`[data-date="${event.startDate}"]`);
                if (!startDayEl) return;
                
                const weekIndex = parseInt(startDayEl.dataset.weekIndex);
                const dayIndex = parseInt(startDayEl.dataset.dayIndex);
                
                // Calculate total days in the event.
                const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                let daysLeft = totalDays;
                let currentWeekIndex = weekIndex;
                let currentDayIndex = dayIndex;

                // Create event segments for each week if needed.
                while (daysLeft > 0 && currentWeekIndex < 5) {
                    const week = weeksContainer.children[currentWeekIndex];
                    if (!week) break;

                    // Calculate how many days we can show in this week.
                    const daysInWeek = Math.min(10  - currentDayIndex, daysLeft);
                    
                    const eventDiv = document.createElement('div');
                    eventDiv.className = `task ${event.type || 'task--primary'} task--stretch`;
                    
                    // Add row transition check.
                    const isLastDayInRow = currentDayIndex === 10;
                    const spansToNextRow = daysLeft > (10 - currentDayIndex);
                    
                    if (daysLeft > daysInWeek) {
                        eventDiv.classList.add('task--continues');
                        if (isLastDayInRow || spansToNextRow) {
                            eventDiv.classList.add('task--row-end');
                        }
                    }
                    if (currentWeekIndex > weekIndex) {
                        eventDiv.classList.add('task--continued');
                        if (currentDayIndex === 0) {
                            eventDiv.classList.add('task--row-start');
                        }
                    }

                    eventDiv.textContent = event.title;
                    
                    // Offset the column start by -1 for visualization.
                    const columnStart = currentDayIndex > 0 ? currentDayIndex - 1 : currentDayIndex;
                    const columnSpan = Math.min(daysInWeek, 10 - currentDayIndex);

                    if (isLastDayInRow && spansToNextRow) {
                        eventDiv.style.gridColumn = `${columnStart} / span ${10 - columnStart}`;
                    } else {
                        eventDiv.style.gridColumn = `${columnStart} / span ${columnSpan}`;
                    }
                    
                    if (currentWeekIndex === weekIndex) {
                        const detailDiv = document.createElement('div');
                        detailDiv.className = 'task__detail';
                        detailDiv.innerHTML = `
                            <div class="task__detail-header">
                                <h2>${event.title}</h2>
                                <button class="delete-event-btn" data-event-id="${event._id}">×</button>
                            </div>
                            <p>${event.description}</p>
                            <p>${monthNames[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()} - 
                               ${monthNames[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}</p>
                        `;
                        eventDiv.appendChild(detailDiv);
                    }

                    week.appendChild(eventDiv);

                    // Update for next iteration.
                    daysLeft -= daysInWeek;
                    currentWeekIndex++;
                    currentDayIndex = 0;
                }
            });
        }

        // Update the sidebar with events for the selected date.
        function updateSidebar(date) {
            const asideDay = document.querySelector('.c-aside__day');
            const asideNum = asideDay.querySelector('.c-aside__num');
            const asideMonth = asideDay.querySelector('.c-aside__month');
            const eventList = document.querySelector('.c-aside__eventList');

            const displayDate = new Date(date);
            displayDate.setDate(displayDate.getDate());

            asideNum.textContent = displayDate.getDate();
            asideMonth.textContent = monthNames[displayDate.getMonth()];

            eventForm.style.display = 'none';

            const dateStr = displayDate.toISOString().split('T')[0];
            const dayEvents = window.events.filter(event => {
                const eventStart = new Date(event.startDate);
                const eventEnd = new Date(event.endDate);
                const checkDate = new Date(dateStr);
                return checkDate >= eventStart && checkDate <= eventEnd;
            });

            updateAddEventButton(dayEvents.length > 0, dayEvents[0]);

            eventList.innerHTML = '';
            if (dayEvents.length === 0) {
                const noEvents = document.createElement('div');
                noEvents.className = 'no-events';
                noEvents.textContent = 'No events found for this date';
                eventList.appendChild(noEvents);
            } else {
            dayEvents.forEach(event => {
                const eventDiv = document.createElement('div');
                    eventDiv.className = `event-item ${event.type}`;
                    eventDiv.innerHTML = `
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                        <div class="event-dates">
                            <span>${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}</span>
                        </div>
                        <button class="delete-event-btn" data-event-id="${event._id}">Delete</button>
                    `;
                    eventList.appendChild(eventDiv);
                });
            }
        }

        // Update the add/edit event button.
        function updateAddEventButton(hasEvent, eventData = null) {
            if (hasEvent) {
                addEventBtn.innerHTML = 'Edit Event <span class="fa fa-edit"></span>';
                addEventBtn.classList.add('edit-mode');
                currentEventId = window.events.indexOf(eventData);
            } else {
                addEventBtn.innerHTML = 'Add Event <span class="fa fa-plus"></span>';
                addEventBtn.classList.remove('edit-mode');
                currentEventId = null;
            }
        }

        // Populate the form with event data for editing.
        function populateFormWithEvent(event) {
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description;
            document.getElementById('eventType').value = event.type;

            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            startDate.setDate(startDate.getDate() + 1);
            endDate.setDate(endDate.getDate() + 1);
            
            createDateSelects('startDateContainer', startDate);
            createDateSelects('endDateContainer', endDate);
        }

        // Handle click events for calendar days and delete buttons.
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('calendar__day') && !e.target.classList.contains('day--disabled')) {
                document.querySelectorAll('.calendar__day').forEach(day => {
                    day.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                selectedDate = new Date(e.target.dataset.date);
                updateSidebar(selectedDate);
                
                if (window.innerWidth <= 768) {
                    showMobileSidebar();
                }
            }
            
            if (e.target.classList.contains('delete-event-btn')) {
                const eventId = e.target.dataset.eventId;
                window.events = window.events.filter(event => event._id !== eventId);
                renderCalendar();
                updateSidebar(selectedDate);
            }
        });

        // Show the event form for adding or editing events.
        addEventBtn.addEventListener('click', function() {
            eventForm.style.display = 'block';
            
            if (currentEventId !== null) {
                const eventToEdit = window.events[currentEventId];
                populateFormWithEvent(eventToEdit);
                document.getElementById('submitEvent').textContent = 'Update Event';
            } else {
                const displayDate = new Date(selectedDate);
                displayDate.setDate(displayDate.getDate());
                createDateSelects('startDateContainer', displayDate);
                createDateSelects('endDateContainer', displayDate);
                document.getElementById('submitEvent').textContent = 'Add Event';
                
                document.getElementById('eventTitle').value = '';
                document.getElementById('eventDescription').value = '';
                document.getElementById('eventType').value = 'task--important';
            }
            
            eventForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // Handle event form submission.
    document.getElementById('submitEvent').addEventListener('click', async function() {
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const type = document.getElementById('eventType').value;

        const startContainer = document.getElementById('startDateContainer');
        const endContainer = document.getElementById('endDateContainer');
        
        const startDate = new Date(
            startContainer.querySelector('select:nth-child(3)').value,
            startContainer.querySelector('select:nth-child(1)').value,
            startContainer.querySelector('select:nth-child(2)').value
        );
        startDate.setDate(startDate.getDate() + 1);

        const endDate = new Date(
            endContainer.querySelector('select:nth-child(3)').value,
            endContainer.querySelector('select:nth-child(1)').value,
            endContainer.querySelector('select:nth-child(2)').value
        );
        endDate.setDate(endDate.getDate() + 1);

        if (title && startDate && endDate) {
            const eventData = {
                title,
                description,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                type
            };

            try {
                let savedEvent;
                if (currentEventId !== null) {
                    savedEvent = await updateEvent(window.events[currentEventId]._id, eventData);
                    window.events[currentEventId] = savedEvent;
                } else {
                    savedEvent = await createEvent(eventData);
                    window.events.push(savedEvent);
                }

                renderCalendar();
                updateSidebar(selectedDate);

                eventForm.style.display = 'none';
                document.getElementById('eventTitle').value = '';
                document.getElementById('eventDescription').value = '';
                document.getElementById('eventType').value = 'task--important';
                currentEventId = null;
                document.getElementById('submitEvent').textContent = 'Add Event';
            } catch (error) {
                console.error('Failed to save event:', error);
                alert('Failed to save event. Please try again.');
            }
        }
    });

    // Cancel event form and reset state.
    document.getElementById('cancelEvent').addEventListener('click', function() {
        eventForm.style.display = 'none';
        currentEventId = null;
        document.getElementById('submitEvent').textContent = 'Add Event';
    });

    // Handle event deletion.
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-event-btn')) {
            const eventId = e.target.dataset.eventId;
            try {
                await deleteEvent(eventId);
                window.events = window.events.filter(event => event._id !== eventId);
                renderCalendar();
                updateSidebar(selectedDate);
            } catch (error) {
                console.error('Failed to delete event:', error);
                alert('Failed to delete event. Please try again.');
            }
        }
    });

    // Add mobile overlay div to the DOM.
    document.body.insertAdjacentHTML('beforeend', '<div class="mobile-overlay"></div>');

    // Show the mobile sidebar.
    function showMobileSidebar() {
        const aside = document.querySelector('.c-aside');
        const overlay = document.querySelector('.mobile-overlay');
        aside.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Hide the mobile sidebar.
    function hideMobileSidebar() {
        const aside = document.querySelector('.c-aside');
        const overlay = document.querySelector('.mobile-overlay');
        aside.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Handle touch events for sliding panel.
    let touchStartY = 0;
    const aside = document.querySelector('.c-aside');

    aside.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    aside.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        if (deltaY > 0) {
            e.preventDefault();
            aside.style.transform = `translateY(${deltaY}px)`;
        }
    });

    aside.addEventListener('touchend', (e) => {
        const touchY = e.changedTouches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        if (deltaY > 100) {
            hideMobileSidebar();
        } else {
            aside.style.transform = '';
        }
    });

    // Update window resize handler.
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            hideMobileSidebar();
            document.body.style.overflow = '';
        }
    });
} catch (error) {
    console.error('Error during initialization:', error);
}
});
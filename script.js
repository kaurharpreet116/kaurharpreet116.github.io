const projects = [
  {
    title: "SQL Employee Database",
    description: "Created a fully normalized employee database with queries and stored procedures.",
    link: "#",
    type: "sql"
  },
  {
    title: "Python Automation Script",
    description: "Automated Excel report generation using Python and pandas.",
    link: "#",
    type: "python"
  },
  {
    title: "Cloud Deployment Demo",
    description: "Deployed a small Python app to AWS Lambda with API Gateway.",
    link: "#",
    type: "cloud"
  },
  {
    title: "Advanced Data Structures",
    description: "Implemented stack, queue, and linked lists projects in Python.",
    link: "#",
    type: "python"
  },
  {
    title: "Networking Simulation",
    description: "Configured DHCP, DNS, and VPN settings for virtual lab exercises.",
    link: "#",
    type: "cloud"
  }
];

const projectGrid = document.getElementById('project-grid');
const filterButtons = document.querySelectorAll('.filter-btn');

// Function to render projects
function renderProjects(filter = 'all') {
  projectGrid.innerHTML = '';
  const filtered = filter === 'all' ? projects : projects.filter(p => p.type === filter);
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <a href="${p.link}" target="_blank">View Project</a>
    `;
    projectGrid.appendChild(card);
  });
}

// Filter button click
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(btn.dataset.type);
  });
});

// Initial render
renderProjects();

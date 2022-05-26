
// const {searchable} = require('../pest.js');
// console.log(` from the outside: ${searchable}`);

let searchable = [
  'Electronics and Communication',
  'Computer Science',
  'Engineering and Computational Mechanics',
  'Biochemical Engineering and Biotechnology',
  'Chemical Engineering',
  'Electrical Engineering',
  'Civil Engineering'
];


const searchInput = document.getElementById('searchCourse');
const searchWrapper = document.querySelector('.wrapper');
const resultsWrapper = document.querySelector('.results');

searchInput.addEventListener('keyup', () => {
  let results = [];
  let input = searchInput.value;
  if (input.length) {
    results = searchable.filter((item) => {
      return item.toLowerCase().includes(input.toLowerCase());
    });
  }
  renderResults(results);
});

function renderResults(results) {
  if (!results.length) {
    return searchWrapper.classList.remove('show');
  }

  const content = results
    .map((item) => {
      return `<li>${item}</li>`;
    })
    .join('');

  searchWrapper.classList.add('show');
  resultsWrapper.innerHTML = `<ul>${content}</ul>`;
}

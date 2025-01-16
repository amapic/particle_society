import Screen2 from './components/Screen2';
import Screen3, { Screen4, Screen5 } from './components/Screen3';
// import Screen4 from './components/Screen4';
import Menu from './components/Menu';
import Hero from './components/Hero';
function App() {
  return (
    <div className="content">
      <Menu />
      <Hero />
      {/* <div className="spacer"></div> */}
      <Screen2 />
      <Screen3 />
      <Screen4 />
      <Screen5 />
    </div>
  );
}

export default App; 
import React from 'react';
import SvgGithubIcon from './svgIcons/SvgGithubIcon';
import SvgTbtcIcon from './svgIcons/SvgTbtcIcon';
import SvgTornadoIcon from './svgIcons/SvgTornadoIcon';

const Footer = () => {
    return (
        <div className="footer">
            <div className="row">
                <div className="column">
                    <a href="https://tbtc.network/" target="_blank">
                        <SvgTbtcIcon fill="#859096" class="icon"></SvgTbtcIcon>
                        <span>TBTC token</span>
                    </a>
                </div>
                <div className="column">
                    <a href="https://tornado.cash/" target="_blank">
                        <SvgTornadoIcon fill="#859096" class="icon"></SvgTornadoIcon>
                        <span>tornado.cash</span>
                    </a>
                </div>
                <div className="column">
                    <a href="https://github.com/tbtctornado" target="_blank">
                        <SvgGithubIcon fill="#859096" class="icon"></SvgGithubIcon>
                        <span>view us on GitHub</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Footer;
